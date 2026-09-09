# Enterprise Deployment Guide

## 1. Containerized Staging & Production Deployment

Run the complete multi-service stack with Docker Compose:

```bash
docker compose -f docker-compose.yml up --build -d
```

### Verification
```bash
# Check running containers
docker compose ps

# Check API health
curl -s http://localhost:5000/healthz | jq
curl -s http://localhost:5000/readyz | jq
```

---

## 2. Kubernetes Readiness & Liveness Probes

The application provides standardized probes:
- **Liveness Probe**: `GET /healthz` (Checks node event loop and uptime)
- **Readiness Probe**: `GET /readyz` (Verifies live connection pool to MySQL and Redis)

Example Kubernetes Pod Spec snippet:

```yaml
livenessProbe:
  httpGet:
    path: /healthz
    port: 5000
  initialDelaySeconds: 15
  periodSeconds: 20

readinessProbe:
  httpGet:
    path: /readyz
    port: 5000
  initialDelaySeconds: 10
  periodSeconds: 10
```

---

## 3. High Availability Scaling Considerations

- **Stateless Backend Nodes**: Can be scaled horizontally (`docker compose up --scale backend=3`) behind Nginx or AWS ALB.
- **Database Connection Pooling**: Max connections per container should be configured to not exceed the database server's `max_connections` limit:
  $$\text{Container Pool Max} \times \text{Number of Replicas} < \text{DB Max Connections}$$
- **Redis Cluster**: For high-availability, configure Sentinel or AWS ElastiCache cluster.
