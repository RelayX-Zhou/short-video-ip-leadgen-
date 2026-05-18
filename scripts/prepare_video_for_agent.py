from __future__ import annotations

import argparse
import json
import math
from datetime import datetime
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Extract representative frames for Codex/Claude vision analysis.")
    parser.add_argument("video", help="Path to a user-owned local video file.")
    parser.add_argument("--mode", choices=["light", "standard", "dense"], default="standard")
    parser.add_argument("--output-dir", default="", help="Optional output directory.")
    return parser.parse_args()


def frame_targets(frame_count: int, fps: float, mode: str) -> list[int]:
    if frame_count <= 0:
        return []
    if mode == "light":
        count = 8
    elif mode == "standard":
        count = 18
    else:
        duration = frame_count / max(fps, 1)
        count = max(12, min(int(math.ceil(duration)), 90))
    if count >= frame_count:
        return list(range(frame_count))
    step = max(frame_count // count, 1)
    return list(range(0, frame_count, step))[:count]


def main() -> int:
    args = parse_args()
    video_path = Path(args.video)
    if not video_path.exists():
        raise SystemExit(f"Video file not found: {video_path}")

    try:
        import cv2
    except Exception as exc:
        raise SystemExit(f"OpenCV is required for frame extraction: {exc}")

    output_dir = Path(args.output_dir) if args.output_dir else video_path.parent / f"{video_path.stem}_codex_frames"
    output_dir.mkdir(parents=True, exist_ok=True)

    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise SystemExit(f"Cannot open video: {video_path}")

    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
    fps = float(cap.get(cv2.CAP_PROP_FPS) or 0) or 25.0
    targets = frame_targets(frame_count, fps, args.mode)
    frames = []

    for idx, frame_no in enumerate(targets, start=1):
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_no)
        ok, frame = cap.read()
        if not ok or frame is None:
            continue
        out = output_dir / f"frame_{idx:03d}.jpg"
        cv2.imwrite(str(out), frame)
        frames.append({"index": idx, "frame": frame_no, "time_seconds": round(frame_no / fps, 2), "path": str(out)})

    cap.release()

    manifest = {
        "source_video": str(video_path),
        "mode": args.mode,
        "created_at": datetime.now().isoformat(timespec="seconds"),
        "fps": fps,
        "frame_count": frame_count,
        "frames": frames,
        "codex_prompt": (
            "请按时间顺序查看这些帧，提取画面中的中文字幕、封面大字、关键屏幕文字，"
            "并分析画面风格、分镜节奏和口播内容结构。只基于可见内容分析，不要编造。"
        ),
    }
    manifest_path = output_dir / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"output_dir": str(output_dir), "manifest": str(manifest_path), "frames": len(frames)}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
