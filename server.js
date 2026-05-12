const express = require('express');
const {Pool}= require('pg');
const bcrypt = require('bcryptjs');

const app = express();
app.use(express.json());
app.use(express.static('public'));