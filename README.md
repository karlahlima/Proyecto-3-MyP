# Tradinn (Actualizado hasta el 25/05)

Stack: 
- Frontend: React + Vite
- Backend: Express + JW
- DB: PostgresSQL
- Proxy inverso: Nginx
- Build: Docker 

## Para ejecutar:

1. Construir y levantar
```docker compose up --build```

2. Abrir en el navegador
```http://localhost:3001```

3. Para detener
```docker compose down```

* Para correr en segundo plano: 
```docker compose up --build```

* Para borrar los datos de la db:
```docker volume prune```