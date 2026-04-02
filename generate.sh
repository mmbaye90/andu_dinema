#!/bin/bash

set -euo pipefail

ITEM_ID="app_20260401"
OUTPUT_FILE="audios.json"
BASE_URL="https://archive.org/download/$ITEM_ID"
METADATA_URL="https://archive.org/metadata/$ITEM_ID"

echo "📡 Récupération metadata..."
METADATA=$(curl -s "$METADATA_URL")

echo "🧠 Extraction metadata globale..."
ARTIST=$(echo "$METADATA" | jq -r '.metadata.creator // "Unknown"')
IMAGE="https://archive.org/services/img/$ITEM_ID"

echo "📝 Génération JSON..."

echo "$METADATA" | jq --arg base "$BASE_URL" \
                    --arg artist "$ARTIST" \
                    --arg img "$IMAGE" '
[
  .files[]
  | select(.name | endswith(".mp3"))
  | {
      title: (.name
        | split("/") | last
        | sub(".mp3$"; "")
        | gsub("\\[[0-9]+\\]"; "")
        | sub("^\\s+"; "")
        | sub("\\s+$"; "")
      ),

      artist: $artist,

      category: (
        if (.name | test("tafsir"; "i")) then "TAFSIR"
        elif (.name | test("coran|quran"; "i")) then "CORAN"
        elif (.name | test("rappel"; "i")) then "RAPPEL"
        elif (.name | test("dars"; "i")) then "DARS"
        elif (.name | test("khutba|khoutba"; "i")) then "KHUTBA"
        elif (.name | test("conference"; "i")) then "CONFERENCE"
        else "DIVERS"
        end
      ),

      duration: (.length // ""),

      image: $img,

      filename: .name,

      url: ($base + "/" + (.name | @uri))
    }
]
' > "$OUTPUT_FILE"

echo "✅ $OUTPUT_FILE généré proprement avec catégorisation intégrée 💪"