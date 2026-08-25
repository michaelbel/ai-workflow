#!/bin/bash
# Notification hook: системное уведомление + голосовое оповещение, когда агент застрял и ждёт ввода.

osascript -e 'display notification "Застрял" with title "Claude Code" sound name "Glass"'
say -v Milena 'Застрял' &
