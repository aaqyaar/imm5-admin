"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { API_URL, api, tokens } from "@/lib/api"
import { callMediaConstraints } from "@/lib/call-media"
import { forceVideoCodec, preferVp8OnPeer } from "@/lib/prefer-video-codec"

type JoinCallResponse = {
  callId: string
  mode: "video" | "audio"
  status: string
  role: string
  iceServers: RTCIceServer[]
  wsPath: string
}

type SignalMessage = {
  type: string
  from?: string
  sdp?: RTCSessionDescriptionInit
  candidate?: RTCIceCandidateInit
  payload?: unknown
}

function wsUrl(wsPath: string) {
  const origin = API_URL.replace(/\/api\/v1\/?$/, "")
  const wsOrigin = origin.replace(/^http/, "ws")
  const token = tokens.access ?? ""
  const sep = wsPath.includes("?") ? "&" : "?"
  return `${wsOrigin}${wsPath}${sep}token=${encodeURIComponent(token)}`
}

function formatElapsed(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

export default function ClinicianCallPage() {
  const { id: appointmentId } = useParams<{ id: string }>()
  const router = useRouter()

  const [status, setStatus] = useState("Preparing…")
  const [muted, setMuted] = useState(false)
  const [camOff, setCamOff] = useState(false)
  const [audioOnly, setAudioOnly] = useState(false)
  const [connected, setConnected] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false)

  const localRef = useRef<HTMLVideoElement>(null)
  const remoteRef = useRef<HTMLVideoElement>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteStreamRef = useRef<MediaStream | null>(null)
  const pendingIce = useRef<RTCIceCandidateInit[]>([])
  const callIdRef = useRef<string | null>(null)
  const makingOffer = useRef(false)
  const roleRef = useRef("clinician")
  const connectedAt = useRef<number | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const recordStartedAt = useRef<number>(0)
  const [recording, setRecording] = useState(false)
  const [uploading, setUploading] = useState(false)

  const bindRemote = useCallback((stream: MediaStream) => {
    remoteStreamRef.current = stream
    setHasRemoteVideo(stream.getVideoTracks().length > 0)
    const el = remoteRef.current
    if (el) {
      el.srcObject = stream
      el.muted = false
      el.volume = 1
      void el.play().catch(() => undefined)
    }
    setConnected(true)
    setStatus("Connected")
    if (!connectedAt.current) connectedAt.current = Date.now()
  }, [])

  const flushIce = useCallback(async (pc: RTCPeerConnection) => {
    if (!pc.remoteDescription) return
    const queued = pendingIce.current.splice(0)
    for (const c of queued) {
      try {
        await pc.addIceCandidate(c)
      } catch {
        /* ignore */
      }
    }
  }, [])

  const hangup = useCallback(async () => {
    try {
      wsRef.current?.send(JSON.stringify({ type: "call-ended" }))
    } catch {
      /* ignore */
    }
    wsRef.current?.close()
    pcRef.current?.close()
    localStreamRef.current?.getTracks().forEach((t) => t.stop())
    const cid = callIdRef.current
    if (cid) {
      try {
        await api.post(`/calls/${cid}/end`, {
          disconnectReason: "clinician_hangup",
        })
      } catch {
        /* ignore */
      }
    }
    router.push("/appointments")
  }, [router])

  useEffect(() => {
    if (!connected) return
    const t = setInterval(() => {
      if (connectedAt.current) {
        setElapsed(Math.floor((Date.now() - connectedAt.current) / 1000))
      }
    }, 1000)
    return () => clearInterval(t)
  }, [connected])

  useEffect(() => {
    let cancelled = false
    if (!appointmentId) return

    let aliveWs: WebSocket | null = null
    let alivePc: RTCPeerConnection | null = null
    let aliveStream: MediaStream | null = null

    ;(async () => {
      try {
        tokens.hydrate()
        setStatus("Accepting appointment…")
        try {
          await api.post(`/admin/appointments/${appointmentId}/accept`)
        } catch {
          /* already assigned */
        }

        setStatus("Joining…")
        const join = await api.post<JoinCallResponse>("/calls/join", {
          appointmentId,
        })
        if (cancelled) return
        callIdRef.current = join.callId
        roleRef.current = join.role
        setAudioOnly(join.mode === "audio")

        const stream = await navigator.mediaDevices.getUserMedia(
          callMediaConstraints(join.mode === "video")
        )
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        aliveStream = stream
        localStreamRef.current = stream
        for (const track of stream.getVideoTracks()) {
          try {
            // Helps Chrome pick a mobile-friendly encode path.
            track.contentHint = "motion"
            track.enabled = true
          } catch {
            /* ignore */
          }
        }
        if (localRef.current) {
          localRef.current.srcObject = stream
          localRef.current.muted = true
          localRef.current.volume = 0
          void localRef.current.play().catch(() => undefined)
        }

        const pc = new RTCPeerConnection({
          iceServers: join.iceServers,
          bundlePolicy: "max-bundle",
          rtcpMuxPolicy: "require",
        })
        alivePc = pc
        pcRef.current = pc
        for (const track of stream.getTracks()) {
          pc.addTrack(track, stream)
        }
        preferVp8OnPeer(pc)

        pc.onicecandidate = (ev) => {
          if (!ev.candidate || wsRef.current?.readyState !== WebSocket.OPEN)
            return
          wsRef.current.send(
            JSON.stringify({
              type: "ice-candidate",
              candidate: ev.candidate.toJSON(),
            })
          )
        }

        pc.ontrack = (ev) => {
          let remote = remoteStreamRef.current
          if (!remote) {
            remote = ev.streams[0] ?? new MediaStream()
            remoteStreamRef.current = remote
          }
          if (
            ev.track &&
            !remote.getTracks().some((t) => t.id === ev.track.id)
          ) {
            remote.addTrack(ev.track)
          }
          // Prefer the browser-provided stream when present.
          if (ev.streams[0]) {
            bindRemote(ev.streams[0])
          } else {
            bindRemote(remote)
          }
        }

        pc.oniceconnectionstatechange = () => {
          const state = pc.iceConnectionState
          if (state === "connected" || state === "completed") {
            setConnected(true)
            setStatus("Connected")
            if (!connectedAt.current) connectedAt.current = Date.now()
          } else if (state === "failed") {
            setStatus("Connection failed — check TURN / network")
          } else if (state === "disconnected") {
            setStatus("Reconnecting…")
          }
        }

        const ws = new WebSocket(wsUrl(join.wsPath))
        aliveWs = ws
        wsRef.current = ws
        ws.onopen = () => setStatus("Waiting for patient…")
        ws.onerror = () => setStatus("Signaling error")
        ws.onclose = () => {
          if (!cancelled) setStatus("Disconnected")
        }

        const answeredRef = { current: false }
        const offeredRef = { current: false }
        let signalChain: Promise<void> = Promise.resolve()
        const enqueue = (fn: () => Promise<void>) => {
          signalChain = signalChain.then(fn).catch((e) => {
            console.warn("[call] signal error", e)
          })
        }

        ws.onmessage = (ev) => {
          let msg: SignalMessage
          try {
            msg = JSON.parse(String(ev.data))
          } catch {
            return
          }
          enqueue(async () => {
            const peer = pcRef.current
            if (!peer) return

            if (msg.type === "call-joined") {
              setStatus("Patient joined — connecting…")
              // Clinician creates the offer (camera already ready). Patient answers.
              // Skip if we already offered or media is up (prevents offer storms).
              if (
                roleRef.current !== "clinician" ||
                offeredRef.current ||
                makingOffer.current ||
                peer.iceConnectionState === "connected" ||
                peer.iceConnectionState === "completed"
              ) {
                return
              }
              makingOffer.current = true
              try {
                for (
                  let i = 0;
                  i < 20 && peer.signalingState !== "stable";
                  i++
                ) {
                  await new Promise((r) => setTimeout(r, 100))
                }
                if (
                  peer.signalingState !== "stable" ||
                  offeredRef.current ||
                  peer.iceConnectionState === "connected"
                ) {
                  return
                }
                // Ensure doctor camera/mic are actually attached + enabled before offering.
                const local = localStreamRef.current
                if (local) {
                  for (const track of local.getTracks()) {
                    track.enabled = true
                    const hasSender = peer
                      .getSenders()
                      .some((s) => s.track?.id === track.id)
                    if (!hasSender) {
                      peer.addTrack(track, local)
                    }
                  }
                }
                offeredRef.current = true
                preferVp8OnPeer(peer)
                const offer = await peer.createOffer({
                  offerToReceiveAudio: true,
                  offerToReceiveVideo: join.mode === "video",
                })
                // Strip H264/AV1 — Chrome must send VP8 or iOS shows a black remote view.
                const offerSdp = forceVideoCodec(offer.sdp || "", "VP8")
                await peer.setLocalDescription({
                  type: offer.type,
                  sdp: offerSdp,
                })
                const desc = peer.localDescription
                ws.send(
                  JSON.stringify({
                    type: "offer",
                    sdp: desc
                      ? {
                          type: desc.type,
                          sdp: forceVideoCodec(desc.sdp || "", "VP8"),
                        }
                      : { type: offer.type, sdp: offerSdp },
                  })
                )
                setStatus("Connecting…")
              } catch (e) {
                offeredRef.current = false
                console.warn("[call] clinician offer failed", e)
              } finally {
                makingOffer.current = false
              }
            } else if (msg.type === "offer" && msg.sdp) {
              if (answeredRef.current || peer.signalingState !== "stable")
                return
              // Keep doctor media in the answer so the patient can render it.
              const localMedia = localStreamRef.current
              if (localMedia) {
                for (const track of localMedia.getTracks()) {
                  track.enabled = true
                  if (
                    !peer.getSenders().some((s) => s.track?.id === track.id)
                  ) {
                    peer.addTrack(track, localMedia)
                  }
                }
              }
              answeredRef.current = true
              preferVp8OnPeer(peer)
              // If iOS offered H264-first, rewrite to VP8 before answering.
              const remote = {
                type: msg.sdp.type,
                sdp: forceVideoCodec(msg.sdp.sdp || "", "VP8"),
              }
              await peer.setRemoteDescription(remote)
              await flushIce(peer)
              const answer = await peer.createAnswer()
              const answerSdp = forceVideoCodec(answer.sdp || "", "VP8")
              await peer.setLocalDescription({
                type: answer.type,
                sdp: answerSdp,
              })
              const desc = peer.localDescription
              ws.send(
                JSON.stringify({
                  type: "answer",
                  sdp: desc
                    ? {
                        type: desc.type,
                        sdp: forceVideoCodec(desc.sdp || "", "VP8"),
                      }
                    : { type: answer.type, sdp: answerSdp },
                })
              )
              setStatus("Connecting…")
            } else if (msg.type === "answer" && msg.sdp) {
              if (peer.signalingState !== "have-local-offer") return
              const answerSdp = forceVideoCodec(msg.sdp.sdp || "", "VP8")
              await peer.setRemoteDescription({
                type: msg.sdp.type,
                sdp: answerSdp || msg.sdp.sdp,
              })
              await flushIce(peer)
              setStatus("Connecting…")
            } else if (msg.type === "ice-candidate" && msg.candidate) {
              if (!peer.remoteDescription) {
                pendingIce.current.push(msg.candidate)
              } else {
                try {
                  await peer.addIceCandidate(msg.candidate)
                } catch {
                  /* ignore */
                }
              }
            } else if (msg.type === "peer-left") {
              // Ignore brief remounts once media is flowing.
              if (
                peer.iceConnectionState === "connected" ||
                peer.iceConnectionState === "completed"
              ) {
                return
              }
              answeredRef.current = false
              offeredRef.current = false
              setHasRemoteVideo(false)
              setConnected(false)
              setStatus("Patient reconnecting…")
            } else if (msg.type === "call-ended") {
              setStatus("Call ended")
              hangup()
            }
          })
        }

        const beat = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "heartbeat" }))
          }
        }, 25000)
        ws.addEventListener("close", () => clearInterval(beat))
      } catch (e) {
        if (!cancelled) {
          setStatus(e instanceof Error ? e.message : "Call failed")
        }
      }
    })()

    return () => {
      cancelled = true
      try {
        aliveWs?.close()
      } catch {
        /* ignore */
      }
      try {
        alivePc?.close()
      } catch {
        /* ignore */
      }
      aliveStream?.getTracks().forEach((t) => t.stop())
      if (wsRef.current === aliveWs) wsRef.current = null
      if (pcRef.current === alivePc) pcRef.current = null
      if (localStreamRef.current === aliveStream) localStreamRef.current = null
    }
    // hangup/bindRemote/flushIce in deps remounted the call after ~1s (reconnect loop).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId])

  function toggleMute() {
    const next = !muted
    localStreamRef.current?.getAudioTracks().forEach((t) => {
      t.enabled = !next
    })
    setMuted(next)
  }

  function toggleCam() {
    const next = !camOff
    localStreamRef.current?.getVideoTracks().forEach((t) => {
      t.enabled = !next
    })
    setCamOff(next)
  }

  async function toggleRecord() {
    if (recording) {
      const rec = recorderRef.current
      if (!rec) {
        setRecording(false)
        return
      }
      const done = new Promise<Blob>((resolve) => {
        rec.onstop = () => {
          resolve(
            new Blob(chunksRef.current, { type: rec.mimeType || "video/webm" })
          )
        }
      })
      rec.stop()
      setRecording(false)
      const blob = await done
      const cid = callIdRef.current
      if (!cid || blob.size === 0) return
      setUploading(true)
      try {
        const form = new FormData()
        form.append("file", blob, `call-${cid}.webm`)
        form.append("source", "client_web")
        form.append("title", "Consultation recording")
        const secs = (Date.now() - recordStartedAt.current) / 1000
        form.append("durationSeconds", String(secs))
        await api.upload(`/calls/${cid}/recordings`, form)
        setStatus("Recording saved")
      } catch (e) {
        setStatus(e instanceof Error ? e.message : "Upload failed")
      } finally {
        setUploading(false)
      }
      return
    }

    const tracks: MediaStreamTrack[] = []
    const remote = remoteStreamRef.current
    const local = localStreamRef.current
    if (remote) {
      tracks.push(...remote.getVideoTracks(), ...remote.getAudioTracks())
    }
    if (local) {
      if (!remote?.getVideoTracks().length) {
        tracks.push(...local.getVideoTracks())
      }
      tracks.push(...local.getAudioTracks())
    }
    if (!tracks.length) {
      setStatus("Nothing to record yet — wait for media")
      return
    }
    const mixed = new MediaStream(tracks)
    const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
      ? "video/webm;codecs=vp8,opus"
      : MediaRecorder.isTypeSupported("video/webm")
        ? "video/webm"
        : ""
    chunksRef.current = []
    const rec = new MediaRecorder(mixed, mime ? { mimeType: mime } : undefined)
    rec.ondataavailable = (ev) => {
      if (ev.data.size) chunksRef.current.push(ev.data)
    }
    recorderRef.current = rec
    recordStartedAt.current = Date.now()
    rec.start(1000)
    setRecording(true)
    setStatus("Recording…")
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0B141A] text-white">
      <div className="relative min-h-0 flex-1">
        {/* Remote full-bleed — patient phone cam; rotate L→R so doctor sees upright. */}
        <video
          ref={remoteRef}
          autoPlay
          playsInline
          className={`absolute inset-0 h-full w-full object-cover ${hasRemoteVideo ? "opacity-100" : "opacity-0"} ${hasRemoteVideo ? "origin-center scale-[1.78] rotate-[360deg]" : ""}`}
        />
        {!hasRemoteVideo ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0B141A]">
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-[#1F2C34] text-4xl text-white/80">
              P
            </div>
            <p className="mt-6 text-lg font-medium">Patient</p>
            <p className="mt-2 text-sm text-white/60">
              {connected ? formatElapsed(elapsed) : status}
            </p>
          </div>
        ) : null}

        {/* Local PiP */}
        {!audioOnly && !camOff ? (
          <video
            ref={localRef}
            autoPlay
            playsInline
            muted
            className="absolute top-16 right-4 z-10 h-40 w-28 rounded-xl border border-white/20 bg-[#1F2C34] object-cover shadow-lg"
          />
        ) : (
          <video ref={localRef} autoPlay playsInline muted className="hidden" />
        )}

        {/* Top */}
        <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-between px-4 pt-4">
          <div>
            <p className="text-lg font-semibold">Patient</p>
            <p className="text-sm text-white/70">
              {connected ? formatElapsed(elapsed) : status}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            asChild
            className="border-white/20 bg-black/30 text-white hover:bg-black/50"
          >
            <Link href="/appointments">Back</Link>
          </Button>
        </div>

        {/* Bottom controls */}
        <div className="absolute inset-x-0 bottom-0 z-20 flex justify-center gap-4 bg-gradient-to-t from-black/70 to-transparent px-4 pt-16 pb-10">
          <button
            type="button"
            onClick={toggleMute}
            className={`flex h-14 w-14 items-center justify-center rounded-full text-sm font-medium ${
              muted ? "bg-white/40" : "bg-white/20"
            }`}
          >
            {muted ? "Unmute" : "Mute"}
          </button>
          {!audioOnly ? (
            <button
              type="button"
              onClick={toggleCam}
              className={`flex h-14 w-14 items-center justify-center rounded-full text-sm font-medium ${
                camOff ? "bg-white/40" : "bg-white/20"
              }`}
            >
              {camOff ? "Cam" : "Cam"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={toggleRecord}
            disabled={uploading}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-xs font-medium"
          >
            {uploading ? "…" : recording ? "Stop" : "Rec"}
          </button>
          <button
            type="button"
            onClick={hangup}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-[#E11C2A] text-sm font-semibold"
          >
            End
          </button>
        </div>
      </div>
    </div>
  )
}
