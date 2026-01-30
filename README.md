# Self-Hosted Global Streaming Server

A distributed audio streaming architecture designed to replace commercial services like Spotify for personal use.
Home server backend written in node.js running locally on rasberry pi 4 coupled with ssd having 1000+ my personal fav songs.
connected to the frontend browser written in nextjs  HTTP/1.1 chucked requests(just like spotify --> no downloding of songs, only streaming chuncks in real time)
which will allow me to access my any song any time any where in the world.

## Project Overview
This system mimics the core functionality of major streaming platforms by implementing:
- **Custom Backend:** Node.js server handling HTTP partial content streaming (206 status).
- **Data Persistence:** Metadata storage using MongoDB.
- **Remote Access:** Zero-trust tunneling for global access without port forwarding.(cloudfare)
- **Hardware:** Optimized for ARM architecture (Raspberry Pi 4) with dedicated SSD storage.

## Tech Stack
- **Runtime:** Node.js (v20+)
- **Database:** MongoDB
- **Frontend:** React / Next.js (Planned)
- **Hardware:** Raspberry Pi 4 + SSD
- **Protocol:** HTTP/1.1 (Chunked Streaming)

## Current Status
- [x] Project Initialization
- [x] Basic Server Setup
- [x] Streaming Logic Implementation
- [ ] Database Integration.
- [ ] Cloudfare tunneling.
- [ ] Domain forwarding.
- [ ] Deploying on main network.
