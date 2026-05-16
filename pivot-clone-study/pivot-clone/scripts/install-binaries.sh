#!/bin/bash
# Render用: yt-dlp と ffmpeg のバイナリをダウンロード
# ビルドコマンドで実行: bash scripts/install-binaries.sh && npm run build

set -e

BIN_DIR="$HOME/.local/bin"
mkdir -p "$BIN_DIR"

# yt-dlp
if ! command -v yt-dlp &> /dev/null; then
  echo "Installing yt-dlp..."
  curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o "$BIN_DIR/yt-dlp"
  chmod +x "$BIN_DIR/yt-dlp"
  echo "yt-dlp installed to $BIN_DIR/yt-dlp"
else
  echo "yt-dlp already installed"
fi

# ffmpeg (static build)
if ! command -v ffmpeg &> /dev/null; then
  echo "Installing ffmpeg..."
  curl -L https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz -o /tmp/ffmpeg.tar.xz
  cd /tmp && tar xf ffmpeg.tar.xz
  cp /tmp/ffmpeg-*-amd64-static/ffmpeg "$BIN_DIR/ffmpeg"
  cp /tmp/ffmpeg-*-amd64-static/ffprobe "$BIN_DIR/ffprobe"
  chmod +x "$BIN_DIR/ffmpeg" "$BIN_DIR/ffprobe"
  rm -rf /tmp/ffmpeg*
  echo "ffmpeg installed to $BIN_DIR"
else
  echo "ffmpeg already installed"
fi

# PATHに追加されていることを確認
export PATH="$BIN_DIR:$PATH"
echo "Binary versions:"
yt-dlp --version 2>/dev/null || echo "yt-dlp: not found in PATH"
ffmpeg -version 2>/dev/null | head -1 || echo "ffmpeg: not found in PATH"
