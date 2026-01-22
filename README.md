# Self-Hosted Global Streaming Server

A distributed audio streaming architecture designed to replace commercial services like Spotify for personal use.

## 🚀 Project Overview
This system mimics the core functionality of major streaming platforms by implementing:
- **Custom Backend:** Node.js server handling HTTP partial content streaming (206 status).
- **Data Persistence:** Metadata storage using MongoDB.
- **Remote Access:** Zero-trust tunneling for global access without port forwarding.(cloudfare)
- **Hardware:** Optimized for ARM architecture (Raspberry Pi 4) with dedicated SSD storage.

## 🛠 Tech Stack
- **Runtime:** Node.js (v18+)
- **Database:** MongoDB
- **Frontend:** React / Next.js (Planned)
- **Hardware:** Raspberry Pi 4 + SSD
- **Protocol:** HTTP/1.1 (Chunked Streaming)

## 🚧 Current Status
- [x] Project Initialization
- [x] Basic Server Setup
- [ ] Streaming Logic Implementation
- [ ] Database Integration
