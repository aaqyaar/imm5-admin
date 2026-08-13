# IMM5 Admin

Scandinavian clinician console for Integrative Metabolic Medicine.

## Setup

```bash
npm install
cp .env.local.example .env.local   # or use existing .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Requires the Go API at `NEXT_PUBLIC_API_URL` (default `http://localhost:8080/api/v1`).

### Seed staff login

```
admin@imm5.health / admin12345
coach@imm5.health / coach12345
```

## Routes

| Path | Description |
| --- | --- |
| `/login` | Staff sign-in |
| `/` | Overview KPIs + growth |
| `/patients` | Patient directory |
| `/patients/[id]` | Profile, assessment, status/role |
| `/challenges` | Walking challenge CRUD |
| `/reports` | Growth + participation |
