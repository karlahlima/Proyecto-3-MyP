CORRER EL BACKEND

1• Abrir Terminal

2• cd /home/ahalgana/Documents/Modelado/Proyecto-3-MyP/start

3• npm start

4• en el navegador abrir: http://localhost:3000

POSTGRESQL

actualmente la base de datos se almacena en mi sistema:

/var/lib/postgresql/16/main

La base de datos tiene un usuario almacenado: 

id: 1
name: Juan Test
email: juan@test.com
username: juantest
age: 25 
created_at: 2026-05-13 00:22:45

Comandos útiles para verificar usuarios:

•Ver la tabla de usuarios registrados:
psql -h localhost -p 5432 -U postgres -d tradinn_db -c "SELECT id, name, email, username, age, created_at FROM users ORDER BY id;"

•Contar cuántos hay:
psql -h localhost -p 5432 -U postgres -d tradinn_db -c "SELECT COUNT(*) FROM users;"

•Ver todos los detalles (sin contraseña):
psql -h localhost -p 5432 -U postgres -d tradinn_db -c "SELECT id, name, email, username, age, created_at FROM users;"

•Ver uno en particular por email:
psql -h localhost -p 5432 -U postgres -d tradinn_db -c "SELECT * FROM users WHERE email = 'juan@test.com';"

•Ver la contraseña hasheada (para verificar que no está en texto plano):
psql -h localhost -p 5432 -U postgres -d tradinn_db -c "SELECT id, email, password_hash FROM users;"

•Borrar un usuario (si es necesario):
psql -h localhost -p 5432 -U postgres -d tradinn_db -c "DELETE FROM users WHERE email = 'juan@test.com';"

Al ejecutar estos comandos se pedirá la contraseña de Pgadmin.

Se conecta de manera remota (por red) a un local host mediante psql por lo que se pueden ejecutar desde cualquier directorio en terminal.