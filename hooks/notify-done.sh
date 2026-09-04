#!/bin/bash
# Stop hook: звук + голосовое оповещение об окончании работы.

afplay /System/Library/Sounds/Glass.aiff
afplay "$(dirname "$0")/assets/finished.wav" &
