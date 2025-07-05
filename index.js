const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

// Путь к файлу с учетными данными Firebase
const serviceAccount = require("./elegant-rp-firebase-adminsdk-fbsvc-f67675518e.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://elegant-rp-default-rtdb.firebaseio.com" // Замените на URL своей базы данных
});

const db = admin.database();
const ref = db.ref("onlinePlayers"); // Указываем путь к данным

const app = express();
app.use(cors());
app.use(express.json());

// Маршрут для получения количества игроков онлайн
app.get('/online', async (req, res) => {
  try {
    const snapshot = await ref.once('value');
    const onlineCount = snapshot.val() || 0;
    res.json({ online: onlineCount });
  } catch (error) {
    console.error("Error getting online count:", error);
    res.status(500).json({ error: 'Failed to get online count' });
  }
});

// Маршрут для увеличения счетчика
app.post('/increment', async (req, res) => {
  console.log("Received increment request");
  try {
    // Сначала проверяем, существует ли узел
    const snapshot = await ref.once('value');
    if (!snapshot.exists()) {
      // Если узла нет, создаем его со значением 0
      await ref.set(0);
      console.log("Created onlinePlayers node with initial value 0");
    }
    // Затем выполняем транзакцию
    await ref.transaction(current => {
      console.log("Current value:", current);
      return (current || 0) + 1;
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Error incrementing online count:", error);
    res.status(500).json({ error: 'Failed to increment online count' });
  }
});

// Маршрут для уменьшения счетчика
app.post('/decrement', async (req, res) => {
  try {
    await ref.transaction(current => {
      return (current || 0) - 1;
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Error decrementing online count:", error);
    res.status(500).json({ error: 'Failed to decrement online count' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});