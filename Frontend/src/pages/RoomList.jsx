import React, { useEffect, useState } from "react";
import axios from "axios";

function RoomList() {
  const [rooms, setRooms] = useState([]);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  const fetchRooms = async () => {
    const res = await axios.get("http://localhost:4000/api/rooms");
    setRooms(res.data);
  };

  const createRoom = async () => {
    const token = localStorage.getItem("token");
    await axios.post(
      "http://localhost:4000/api/rooms",
      { name, description: desc },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setName("");
    setDesc("");
    fetchRooms();
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>📦 채팅방 목록</h2>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="방 이름"
      />
      <input
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        placeholder="설명"
      />
      <button onClick={createRoom}>방 만들기</button>

      <ul>
        {rooms.map((r) => (
          <li key={r.id}>
            <b>{r.name}</b> — {r.description}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default RoomList;