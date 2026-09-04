#!/bin/bash
# Notification hook: системное уведомление + голосовое оповещение, когда агент застрял и ждёт ввода.

osascript -e 'display notification "Я застряла" with title "Claude Code" sound name "Glass"'
afplay "$(dirname "$0")/assets/stuck.wav" &
