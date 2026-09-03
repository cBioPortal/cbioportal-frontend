#!/usr/bin/env bash
#
# Static failures-viewer: scans the Playwright test-results/ directory for
# per-test artifact folders (one per failure) and emits a self-contained
# index.html. Each row exposes error-context.md, trace.zip, the failure
# screenshot, and the expected/actual/diff triple — plus an overlay viewer
# that superimposes actual on expected with an opacity slider (0-100%,
# default 50%). A toolbar button toggles every overlay at once.
#
# Usage: bash build.sh [test-results-dir] [output-dir]
# Defaults: ../../test-results  and  /tmp/failures-index
#
# Serve with e.g. `python3 -m http.server 9323 --bind 0.0.0.0` from the
# output directory. A `file` symlink points at test-results so relative
# hrefs resolve.
#
set -e
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ROOT=${1:-$SCRIPT_DIR/../../test-results}
OUT_DIR=${2:-/tmp/failures-index}
OUT=$OUT_DIR/index.html
mkdir -p "$OUT_DIR"
{
  cat <<'HEAD'
<!DOCTYPE html><html><head><meta charset="utf-8"><title>Failures</title>
<style>
body{font-family:system-ui;margin:0;padding:20px;background:#f5f5f5}
h1{font-size:18px}
.row{background:#fff;margin:6px 0;padding:10px;border-radius:4px;border-left:4px solid #d33}
.name{font-family:monospace;font-size:13px;word-break:break-all;cursor:pointer}
.name:hover{color:#06c}
.links{margin-top:6px;font-size:12px}
.links a{margin-right:10px;color:#06c;text-decoration:none}
.links a:hover{text-decoration:underline}
.err{font-family:monospace;font-size:11px;color:#900;white-space:pre-wrap;margin-top:6px;max-height:6em;overflow:hidden}
.overlay{display:none;margin-top:10px;background:#222;padding:10px;border-radius:4px}
.overlay.open{display:block}
.stack{position:relative;display:inline-block;background:#000;max-width:100%}
.stack img{display:block;max-width:100%;height:auto}
.stack img.actual{position:absolute;top:0;left:0;opacity:0.5}
.slider-row{display:flex;align-items:center;gap:10px;color:#eee;font-size:12px;margin-bottom:6px;font-family:system-ui}
.slider-row input[type=range]{flex:1;max-width:300px}
.slider-row .val{font-family:monospace;min-width:3em}
.toolbar{position:sticky;top:0;background:#f5f5f5;padding:10px 0;margin-bottom:10px;z-index:10;border-bottom:1px solid #ddd;display:flex;align-items:center;gap:12px}
.toolbar button{background:#06c;color:#fff;border:0;padding:8px 14px;border-radius:4px;cursor:pointer;font-size:13px}
.toolbar button:hover{background:#04a}
</style></head><body>
HEAD
  echo "<div class=\"toolbar\"><button onclick=\"toggleAll()\">Toggle all overlays</button></div>"
  echo "<h1>Playwright failures ($(ls -d "$ROOT"/*/ 2>/dev/null | wc -l) tests)</h1>"
  i=0
  for d in "$ROOT"/*/; do
    name=$(basename "$d")
    expected=""
    actual=""
    diff=""
    for img in "$d"/*-expected.png; do [ -f "$img" ] && expected=$(basename "$img"); done
    for img in "$d"/*-actual.png;   do [ -f "$img" ] && actual=$(basename "$img"); done
    for img in "$d"/*-diff.png;     do [ -f "$img" ] && diff=$(basename "$img"); done
    echo "<div class=\"row\"><div class=\"name\" onclick=\"toggleOverlay('ov$i')\">$name</div><div class=\"links\">"
    [ -f "$d/error-context.md" ]   && echo "<a href=\"file/$name/error-context.md\">error-context</a>"
    [ -f "$d/trace.zip" ]          && echo "<a href=\"file/$name/trace.zip\">trace.zip</a>"
    [ -f "$d/test-failed-1.png" ]  && echo "<a href=\"file/$name/test-failed-1.png\">screenshot</a>"
    [ -n "$expected" ] && echo "<a href=\"file/$name/$expected\">expected</a>"
    [ -n "$actual" ]   && echo "<a href=\"file/$name/$actual\">actual</a>"
    [ -n "$diff" ]     && echo "<a href=\"file/$name/$diff\">diff</a>"
    echo "</div>"
    if [ -n "$expected" ] && [ -n "$actual" ]; then
      echo "<div class=\"overlay\" id=\"ov$i\">"
      echo "<div class=\"slider-row\"><span>actual opacity</span>"
      echo "<input type=\"range\" min=\"0\" max=\"100\" value=\"50\" oninput=\"setOpacity('ov$i', this.value)\">"
      echo "<span class=\"val\" id=\"ov${i}_val\">50%</span></div>"
      echo "<div class=\"stack\">"
      echo "<img class=\"expected\" src=\"file/$name/$expected\" alt=\"expected\">"
      echo "<img class=\"actual\"   src=\"file/$name/$actual\"   alt=\"actual\">"
      echo "</div></div>"
    fi
    if [ -f "$d/error-context.md" ]; then
      echo '<div class="err">'
      head -c 400 "$d/error-context.md" | sed 's/&/\&amp;/g;s/</\&lt;/g;s/>/\&gt;/g'
      echo '</div>'
    fi
    echo "</div>"
    i=$((i+1))
  done
  cat <<'FOOT'
<script>
function toggleOverlay(id){
  var el=document.getElementById(id);
  if(el) el.classList.toggle('open');
}
function toggleAll(){
  var els=document.querySelectorAll('.overlay');
  var anyClosed=Array.from(els).some(function(e){return !e.classList.contains('open')});
  els.forEach(function(e){ if(anyClosed) e.classList.add('open'); else e.classList.remove('open'); });
}
function setOpacity(id, v){
  var el=document.getElementById(id);
  if(!el) return;
  var img=el.querySelector('img.actual');
  if(img) img.style.opacity=(v/100);
  var lbl=document.getElementById(id+'_val');
  if(lbl) lbl.textContent=v+'%';
}
</script>
</body></html>
FOOT
} > "$OUT"
ln -sfn "$ROOT" "$OUT_DIR/file"
echo "wrote $OUT ($(wc -c < "$OUT") bytes)"
