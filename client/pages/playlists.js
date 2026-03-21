import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

const PlayIcon = ({ color = "currentColor", size = 20 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M8 5v14l11-7z" /></svg>);
const PauseIcon = ({ color = "currentColor", size = 20 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>);
const NextIcon = ({ color = "white", size = 20 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>);
const PrevIcon = ({ color = "white", size = 20 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>);
const TrashIcon = ({ size = 16 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="#ff4d4d"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>);

const formatTime = (seconds) => {
    if (!seconds) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
};

export default function Playlists() {
    const router = useRouter();
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    const audioRef = useRef(null);

    const [playlists, setPlaylists] = useState([]);
    const [selectedPlaylist, setSelectedPlaylist] = useState(null); // The open playlist
    const [newName, setNewName] = useState('');
    const [creating, setCreating] = useState(false);

    // Player state
    const [currentSong, setCurrentSong] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [playlistQueue, setPlaylistQueue] = useState([]); // songs of currently playing playlist
    const [isShuffle, setIsShuffle] = useState(false);

    // Security check
    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');

        if (!token || role === 'guest') {
            alert("You need a permanent account to use playlists.");
            router.push('/login');
            return;
        }
        fetchPlaylists(token);
    }, []);

    const fetchPlaylists = async (token) => {
        try {
            const res = await fetch(`${API_URL}/api/playlists`, {
                headers: { 'auth-token': token }
            });
            const data = await res.json();
            if (Array.isArray(data)) setPlaylists(data);
        } catch (err) {
            console.error("Failed to fetch playlists:", err);
        }
    };

    const createPlaylist = async () => {
        if (!newName.trim()) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/playlists`, {
                method: 'POST',
                headers: { 'auth-token': token, 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName.trim() })
            });
            const data = await res.json();
            if (res.ok) {
                setPlaylists([data, ...playlists]);
                setNewName('');
                setCreating(false);
            } else {
                alert(data.error);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const deletePlaylist = async (playlistId, e) => {
        e.stopPropagation();
        if (!window.confirm("Delete this playlist? Songs won't be deleted.")) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/playlists/${playlistId}`, {
                method: 'DELETE',
                headers: { 'auth-token': token }
            });
            if (res.ok) {
                setPlaylists(playlists.filter(p => p._id !== playlistId));
                if (selectedPlaylist?._id === playlistId) setSelectedPlaylist(null);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const removeSongFromPlaylist = async (playlistId, songId, e) => {
        e.stopPropagation();
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/playlists/${playlistId}/songs/${songId}`, {
                method: 'DELETE',
                headers: { 'auth-token': token }
            });
            const updated = await res.json();
            if (res.ok) {
                setPlaylists(playlists.map(p => p._id === playlistId ? updated : p));
                setSelectedPlaylist(updated);
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Fisher-Yates shuffle — proper random, not Math.random() sort hack
    const shuffleArray = (arr) => {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    };

    // Play a song within the context of a playlist
    const playSong = (song, queue) => {
        if (queue) setPlaylistQueue(queue);
        if (currentSong?._id === song._id) {
            if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
            else { audioRef.current.play(); setIsPlaying(true); }
        } else {
            setCurrentSong(song);
            setIsPlaying(true);
            setTimeout(() => audioRef.current && audioRef.current.play(), 100);
        }
    };

    const playShuffle = (songs) => {
        const shuffled = shuffleArray(songs);
        setPlaylistQueue(shuffled);
        setIsShuffle(true);
        setCurrentSong(shuffled[0]);
        setIsPlaying(true);
        setTimeout(() => audioRef.current && audioRef.current.play(), 100);
    };

    const playNext = () => {
        if (playlistQueue.length === 0) return;
        if (isShuffle) {
            // In shuffle mode — pick a random song that isn't the current one
            const others = playlistQueue.filter(s => s._id !== currentSong?._id);
            if (others.length === 0) return;
            const next = others[Math.floor(Math.random() * others.length)];
            playSong(next, null);
        } else {
            const idx = playlistQueue.findIndex(s => s._id === currentSong?._id);
            const next = playlistQueue[idx + 1] || playlistQueue[0];
            playSong(next, null);
        }
    };

    const playPrev = () => {
        if (playlistQueue.length === 0) return;
        const idx = playlistQueue.findIndex(s => s._id === currentSong?._id);
        const prev = playlistQueue[idx - 1] || playlistQueue[playlistQueue.length - 1];
        playSong(prev, null);
    };

    return (
        <div style={s.container}>
            <style jsx global>{`body { margin: 0; padding: 0; background-color: #121212; }`}</style>

            {/* HEADER */}
            <div style={s.header}>
                <h1 style={s.title}>🎵 My <span style={{ color: '#1DB954' }}>Playlists</span></h1>
                <Link href="/"><button style={s.navBtn}>← Back to Library</button></Link>
            </div>

            <div style={s.layout}>

                {/* LEFT — Playlist List */}
                <div style={s.sidebar}>
                    <div style={s.sidebarHeader}>
                        <h2 style={s.sectionTitle}>Your Playlists</h2>
                        <button onClick={() => setCreating(!creating)} style={s.createBtn}>+ New</button>
                    </div>

                    {/* Create Playlist Form */}
                    {creating && (
                        <div style={s.createForm}>
                            <input
                                autoFocus
                                type="text"
                                placeholder="Playlist name..."
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && createPlaylist()}
                                style={s.input}
                            />
                            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                <button onClick={createPlaylist} style={s.confirmBtn}>Create</button>
                                <button onClick={() => { setCreating(false); setNewName(''); }} style={s.cancelBtn}>Cancel</button>
                            </div>
                        </div>
                    )}

                    {playlists.length === 0 && !creating && (
                        <p style={s.emptyText}>No playlists yet. Hit + New to create one!</p>
                    )}

                    {playlists.map(pl => (
                        <div
                            key={pl._id}
                            onClick={() => setSelectedPlaylist(pl)}
                            style={{
                                ...s.playlistItem,
                                backgroundColor: selectedPlaylist?._id === pl._id ? 'rgba(29,185,84,0.15)' : 'rgba(255,255,255,0.04)',
                                border: selectedPlaylist?._id === pl._id ? '1px solid #1DB954' : '1px solid transparent'
                            }}
                        >
                            <div style={s.playlistThumb}>
                                {pl.songs?.[0]?.image ? (
                                    <img
                                        src={pl.songs[0].image?.startsWith('http') ? pl.songs[0].image : `${API_URL}${pl.songs[0].image}`}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '6px' }}
                                        alt="cover"
                                    />
                                ) : <span style={{ fontSize: '24px' }}>🎵</span>}
                            </div>
                            <div style={{ flexGrow: 1, overflow: 'hidden' }}>
                                <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pl.name}</div>
                                <div style={{ color: '#888', fontSize: '12px' }}>{pl.songs?.length || 0} songs</div>
                            </div>
                            <button onClick={(e) => deletePlaylist(pl._id, e)} style={s.iconBtn} title="Delete playlist">
                                <TrashIcon />
                            </button>
                        </div>
                    ))}
                </div>

                {/* RIGHT — Playlist Detail */}
                <div style={s.detail}>
                    {!selectedPlaylist ? (
                        <div style={s.emptyDetail}>
                            <p style={{ fontSize: '40px' }}>🎧</p>
                            <p style={{ color: '#555' }}>Select a playlist to view its songs</p>
                        </div>
                    ) : (
                        <>
                            <div style={s.detailHeader}>
                                <h2 style={{ color: '#fff', margin: 0 }}>{selectedPlaylist.name}</h2>
                                <span style={{ color: '#888', fontSize: '14px' }}>{selectedPlaylist.songs?.length || 0} songs</span>
                                {selectedPlaylist.songs?.length > 0 && (
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        <button
                                            onClick={() => { setIsShuffle(false); playSong(selectedPlaylist.songs[0], selectedPlaylist.songs); }}
                                            style={s.playAllBtn}
                                        >
                                            ▶ Play All
                                        </button>
                                        <button
                                            onClick={() => playShuffle(selectedPlaylist.songs)}
                                            style={{
                                                ...s.playAllBtn,
                                                backgroundColor: isShuffle ? '#1DB954' : 'transparent',
                                                color: isShuffle ? '#000' : '#1DB954',
                                                border: '1px solid #1DB954',
                                                display: 'flex', alignItems: 'center', gap: '6px'
                                            }}
                                        >
                                            {/* Shuffle SVG icon */}
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
                                            </svg>
                                            Shuffle
                                        </button>
                                    </div>
                                )}
                            </div>

                            {selectedPlaylist.songs?.length === 0 && (
                                <p style={s.emptyText}>This playlist is empty. Add songs using the <strong style={{ color: '#1DB954' }}>+</strong> button on any song in the library.</p>
                            )}

                            {selectedPlaylist.songs?.map(song => (
                                <div
                                    key={song._id}
                                    onClick={() => playSong(song, selectedPlaylist.songs)}
                                    style={{
                                        ...s.songRow,
                                        backgroundColor: currentSong?._id === song._id ? 'rgba(29,185,84,0.1)' : 'rgba(255,255,255,0.04)',
                                        border: currentSong?._id === song._id ? '1px solid #1DB954' : '1px solid transparent'
                                    }}
                                >
                                    <img
                                        src={song.image?.startsWith('http') ? song.image : `${API_URL}${song.image}`}
                                        style={s.thumb}
                                        alt="cover"
                                    />
                                    <div style={{ flexGrow: 1 }}>
                                        <div style={{ color: currentSong?._id === song._id ? '#1DB954' : '#fff', fontWeight: 'bold', fontSize: '14px' }}>{song.title}</div>
                                        <div style={{ color: '#888', fontSize: '12px' }}>{song.artist}</div>
                                    </div>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        {currentSong?._id === song._id && isPlaying
                                            ? <PauseIcon color="#1DB954" />
                                            : <PlayIcon color="#fff" />}
                                        <button
                                            onClick={(e) => removeSongFromPlaylist(selectedPlaylist._id, song._id, e)}
                                            style={s.iconBtn}
                                            title="Remove from playlist"
                                        >
                                            <TrashIcon />
                                        </button>
                                    </span>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </div>

            {/* PLAYER BAR */}
            {currentSong && (
                <div style={s.player}>
                    <div style={s.playerInfo}>
                        <img
                            src={currentSong.image?.startsWith('http') ? currentSong.image : `${API_URL}${currentSong.image}`}
                            style={s.playerArt}
                            alt="cover"
                        />
                        <div>
                            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{currentSong.title}</div>
                            <div style={{ fontSize: '12px', color: '#ccc' }}>{currentSong.artist}</div>
                        </div>
                    </div>
                    <div style={s.controls}>
                        <button
                            onClick={() => setIsShuffle(!isShuffle)}
                            style={{
                                ...s.ctrlBtn,
                                color: isShuffle ? '#1DB954' : '#666',
                                position: 'relative'
                            }}
                            title={isShuffle ? 'Shuffle On' : 'Shuffle Off'}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
                            </svg>
                            {isShuffle && <span style={{ position: 'absolute', bottom: '-2px', left: '50%', transform: 'translateX(-50%)', width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#1DB954' }} />}
                        </button>
                        <button style={s.ctrlBtn} onClick={playPrev}><PrevIcon /></button>
                        <button style={s.playBtn} onClick={() => {
                            if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
                            else { audioRef.current.play(); setIsPlaying(true); }
                        }}>
                            {isPlaying ? <PauseIcon color="#000" size={24} /> : <PlayIcon color="#000" size={24} />}
                        </button>
                        <button style={s.ctrlBtn} onClick={playNext}><NextIcon /></button>
                    </div>
                    <div style={s.progressBar}>
                        <span style={s.timeText}>{formatTime(currentTime)}</span>
                        <input type="range" min="0" max={duration || 0} value={currentTime}
                            onChange={e => { audioRef.current.currentTime = e.target.value; setCurrentTime(e.target.value); }}
                            style={{ flexGrow: 1, accentColor: '#1DB954', cursor: 'pointer' }} />
                        <span style={s.timeText}>{formatTime(duration)}</span>
                    </div>
                    <audio
                        ref={audioRef}
                        src={`${API_URL}/music/${currentSong.filename}`}
                        onTimeUpdate={e => setCurrentTime(e.target.currentTime)}
                        onLoadedMetadata={e => setDuration(e.target.duration)}
                        onEnded={playNext}
                        autoPlay
                    />
                </div>
            )}
        </div>
    );
}

const s = {
    container: { backgroundColor: '#121212', color: '#fff', minHeight: '100vh', paddingBottom: '130px', fontFamily: 'sans-serif' },
    header: { padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #222' },
    title: { margin: 0, fontSize: '24px' },
    navBtn: { padding: '6px 14px', backgroundColor: '#333', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' },
    layout: { display: 'flex', gap: '0', minHeight: 'calc(100vh - 80px)' },

    // Sidebar
    sidebar: { width: '300px', minWidth: '260px', borderRight: '1px solid #222', padding: '20px 16px', overflowY: 'auto' },
    sidebarHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
    sectionTitle: { margin: 0, fontSize: '15px', color: '#b3b3b3', textTransform: 'uppercase', letterSpacing: '1px' },
    createBtn: { padding: '5px 12px', backgroundColor: '#1DB954', border: 'none', color: '#000', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' },
    createForm: { backgroundColor: '#1e1e1e', padding: '12px', borderRadius: '8px', marginBottom: '12px' },
    input: { width: '100%', padding: '8px 10px', backgroundColor: '#2e2e2e', border: '1px solid #444', borderRadius: '6px', color: '#fff', fontSize: '14px', boxSizing: 'border-box' },
    confirmBtn: { padding: '6px 14px', backgroundColor: '#1DB954', border: 'none', color: '#000', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' },
    cancelBtn: { padding: '6px 14px', backgroundColor: 'transparent', border: '1px solid #555', color: '#ccc', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
    playlistItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', borderRadius: '8px', cursor: 'pointer', marginBottom: '6px', transition: '0.15s' },
    playlistThumb: { width: '44px', height: '44px', borderRadius: '6px', backgroundColor: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' },
    iconBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' },
    emptyText: { color: '#555', fontSize: '13px', textAlign: 'center', marginTop: '20px', lineHeight: '1.6' },

    // Detail panel
    detail: { flexGrow: 1, padding: '24px', overflowY: 'auto' },
    emptyDetail: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' },
    detailHeader: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' },
    playAllBtn: { padding: '7px 18px', backgroundColor: '#1DB954', border: 'none', color: '#000', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' },
    songRow: { display: 'flex', alignItems: 'center', gap: '14px', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', marginBottom: '6px', transition: '0.15s' },
    thumb: { width: '46px', height: '46px', borderRadius: '4px', objectFit: 'cover', flexShrink: 0 },

    // Player
    player: { position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(24,24,24,0.97)', backdropFilter: 'blur(10px)', padding: '12px 20px', borderTop: '1px solid #333', zIndex: 10 },
    playerInfo: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' },
    playerArt: { width: '38px', height: '38px', borderRadius: '4px', objectFit: 'cover' },
    controls: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginBottom: '8px' },
    ctrlBtn: { background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' },
    playBtn: { width: '44px', height: '44px', borderRadius: '50%', border: 'none', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
    progressBar: { display: 'flex', alignItems: 'center', gap: '10px' },
    timeText: { fontSize: '12px', color: '#b3b3b3', minWidth: '35px' }
};
