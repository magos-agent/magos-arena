#!/bin/bash
# Create a music video from image + audio
# Usage: ./create-music-video.sh <image> <audio> <output.mp4>

IMAGE=$1
AUDIO=$2
OUTPUT=$3

if [ -z "$IMAGE" ] || [ -z "$AUDIO" ] || [ -z "$OUTPUT" ]; then
    echo "Usage: $0 <image> <audio> <output.mp4>"
    exit 1
fi

# Get audio duration
DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$AUDIO")

# Create video with static image + audio
ffmpeg -y -loop 1 -i "$IMAGE" -i "$AUDIO" \
    -c:v libx264 -tune stillimage -c:a aac -b:a 192k \
    -pix_fmt yuv420p -shortest \
    -t "$DURATION" \
    "$OUTPUT"

echo "Created: $OUTPUT"
