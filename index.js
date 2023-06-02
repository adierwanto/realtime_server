const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const mysql = require('mysql');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Koneksi ke database MySQL
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'project_jo'
});

connection.connect((error) => {
  if (error) {
    console.error('Koneksi MySQL gagal: ' + error.stack);
    return;
  }

  console.log('Terhubung ke database MySQL dengan ID: ' + connection.threadId);
});

// Mengirim data ke semua klien terhubung setiap 2 detik
function sendData() {
  connection.query('SELECT * FROM tes_datas', (error, results) => {
    if (error) {
      console.error('Error saat mengambil data dari MySQL: ' + error.stack);
      return;
    }

    io.sockets.emit('data-update', results);
  });
}

// Memulai interval pembaruan data setiap 2 detik
setInterval(sendData, 2000);

// Mengatur endpoint untuk mengambil data dari MySQL
app.get('/get-data', (req, res) => {
  connection.query('SELECT * FROM tes_datas', (error, results) => {
    if (error) {
      console.error('Error saat mengambil data dari MySQL: ' + error.stack);
      res.status(500).send('Error saat mengambil data dari MySQL');
      return;
    }

    res.send(results);
  });
});

// Memulai server Socket.IO
io.on('connection', (socket) => {
  console.log('Klien terhubung: ' + socket.id);

  // Mengirim data saat klien terhubung pertama kali
  sendData();

  // Menutup koneksi saat klien terputus
  socket.on('disconnect', () => {
    console.log('Klien terputus: ' + socket.id);
  });
});

// Menjalankan server
const port = 3000;
server.listen(port, () => {
  console.log('Server berjalan di http://localhost:' + port);
});
