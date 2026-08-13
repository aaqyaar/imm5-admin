/**
 * Chrome → iOS one-way video fix.
 * Force VP8 so Chrome does not send H264 High / AV1 that iOS cannot decode.
 */

function parseRtpmap(lines: string[]) {
  const rtpmap = new Map<string, string>()
  const apt = new Map<string, string>()
  for (const line of lines) {
    let m = /^a=rtpmap:(\d+)\s+([^/\s]+)/i.exec(line)
    if (m) rtpmap.set(m[1], m[2].toUpperCase())
    m = /^a=fmtp:(\d+)\s+.*\bapt=(\d+)/i.exec(line)
    if (m) apt.set(m[1], m[2])
  }
  return { rtpmap, apt }
}

export function preferVideoCodec(sdp: string, codec: "VP8" | "H264" | "VP9" = "VP8"): string {
  return forceVideoCodec(sdp, codec === "VP9" ? "VP8" : codec)
}

/** Keep only VP8 (or H264) + RTX/FEC on the video m-line. */
export function forceVideoCodec(sdp: string, codec: "VP8" | "H264" = "VP8"): string {
  if (!sdp) return sdp
  const nl = sdp.includes("\r\n") ? "\r\n" : "\n"
  const lines = sdp.split(nl)
  const mIndex = lines.findIndex((l) => l.startsWith("m=video"))
  if (mIndex < 0) return sdp

  const { rtpmap, apt } = parseRtpmap(lines)
  const parts = lines[mIndex].split(" ")
  if (parts.length < 4) return sdp
  const head = parts.slice(0, 3)
  const allPts = parts.slice(3)
  const want = codec.toUpperCase()

  const keep = new Set<string>()
  for (const pt of allPts) {
    if (rtpmap.get(pt) === want) keep.add(pt)
  }
  if (!keep.size) return sdp

  for (const pt of allPts) {
    const name = rtpmap.get(pt) ?? ""
    if (name === "RTX" && keep.has(apt.get(pt) ?? "")) keep.add(pt)
    if (name === "RED" || name === "ULPFEC" || name.startsWith("FLEXFEC")) keep.add(pt)
  }

  const primary = allPts.filter((pt) => keep.has(pt) && rtpmap.get(pt) === want)
  const rest = allPts.filter((pt) => keep.has(pt) && rtpmap.get(pt) !== want)
  lines[mIndex] = [...head, ...primary, ...rest].join(" ")

  const videoPts = new Set(allPts)
  const out = lines.filter((line, i) => {
    if (i === mIndex) return true
    const m = /^a=(?:rtpmap|fmtp|rtcp-fb):(\d+)/.exec(line)
    if (!m) return true
    const pt = m[1]
    if (videoPts.has(pt) && !keep.has(pt)) return false
    return true
  })

  return out.join(nl)
}

/** VP8 only on video transceivers (no H264/AV1 fallback for sending). */
export function preferVp8OnPeer(pc: RTCPeerConnection) {
  try {
    const caps = RTCRtpReceiver.getCapabilities?.("video")
    if (!caps?.codecs?.length) return
    const vp8 = caps.codecs.filter((c) => /video\/vp8/i.test(c.mimeType))
    const rtx = caps.codecs.filter((c) => /video\/rtx/i.test(c.mimeType))
    const prefs = [...vp8, ...rtx]
    if (!vp8.length) return
    for (const t of pc.getTransceivers()) {
      if (t.sender.track?.kind === "video" || t.receiver.track?.kind === "video" || t.mid != null) {
        try {
          t.setCodecPreferences(prefs)
        } catch {
          try {
            t.setCodecPreferences(vp8)
          } catch {
            /* ignore */
          }
        }
      }
    }
  } catch {
    /* ignore */
  }
}
