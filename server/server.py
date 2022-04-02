import asyncio
import os
from io import BytesIO

from aiohttp import web

ALLOWED_EXT = [".png", ".jpeg", ".jpg"]


async def process_request(request: web.Request):
    reader = await request.multipart()
    field = await reader.next()
    assert field.name == "photo"
    filename, ext = os.path.splitext(field.filename)
    if ext.lower() not in ALLOWED_EXT:
        return web.json_response(
            {"error": f"supported formats: {','.join(ALLOWED_EXT)} "}
        )
    content = BytesIO()
    while True:
        chunk = await field.read_chunk(size=65536)
        if not chunk:
            break
        content.write(chunk)

    content.seek(0)
    return content, field.filename


async def execute_shell(cmd, content):
    proc = await asyncio.create_subprocess_shell(
        cmd=cmd,
        stdin=asyncio.subprocess.PIPE,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, stderr = await proc.communicate(content.read())
    if stdout:
        content = BytesIO(stdout)
        return content


async def parse_exif(content):
    output = await execute_shell(cmd="exiftool -c '%.6f' -S -", content=content)
    output = output.read().decode().splitlines()
    exif = {}
    if output:
        for line in output:
            key, value = line.split(":", maxsplit=1)
            if key and value:
                exif[key.strip()] = value.strip()
    return exif


async def remove(request: web.Request):
    content, filename = await process_request(request)
    if content:
        content = await execute_shell(cmd="exiftool -all= -", content=content)
        response = web.StreamResponse(status=200)
        response.enable_chunked_encoding()
        await response.prepare(request)
        while True:
            chunk = content.read(65536)
            if not chunk:
                break
            await response.write(chunk)

        await response.write_eof()


async def upload(request: web.Request):
    content, filename = await process_request(request)
    exif_data = await parse_exif(content)
    return web.json_response(
        {"data": exif_data, "filename": filename},
    )


if __name__ == "__main__":
    app = web.Application()
    app.add_routes([web.post("/api/upload", upload, name="upload")])
    app.add_routes([web.post("/api/remove", remove, name="remove")])
    web.run_app(app, port=8080)
