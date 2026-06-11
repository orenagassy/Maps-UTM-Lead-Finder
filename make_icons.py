"""Generate simple placeholder icons for the extension."""
import struct, zlib, pathlib

def png(size, r, g, b):
    """Minimal valid PNG: solid color square."""
    def chunk(tag, data):
        c = zlib.crc32(tag + data) & 0xFFFFFFFF
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", c)

    ihdr = chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0))
    raw = b"".join(b"\x00" + bytes([r, g, b] * size) for _ in range(size))
    idat = chunk(b"IDAT", zlib.compress(raw))
    iend = chunk(b"IEND", b"")
    return b"\x89PNG\r\n\x1a\n" + ihdr + idat + iend

icons_dir = pathlib.Path(__file__).parent / "icons"
icons_dir.mkdir(exist_ok=True)

for size in (16, 48, 128):
    (icons_dir / f"icon{size}.png").write_bytes(png(size, 26, 115, 232))  # #1a73e8 blue

print("Icons created.")
