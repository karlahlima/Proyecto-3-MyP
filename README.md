# Tradinn (Actualizado hasta el 25/05)

Stack: 
- Frontend: React + Vite
- Backend: Express + JW
- DB: PostgresSQL
- Proxy inverso: Nginx
- Build: Docker 

## Para ejecutar:

1. Copiar el archivo de variables de entorno
```cp .env.example .env```

2. Construir y levantar
```docker compose up --build```

3. Abrir en el navegador
```http://localhost:8080```

4. Para detener
```docker compose down```

* Para correr en segundo plano: 
```docker compose up --build -d```

* Para borrar los datos de la db:
```docker compose down -v```