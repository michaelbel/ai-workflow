#!/bin/bash
# Stop hook: звук + голосовое оповещение об окончании работы.

afplay /System/Library/Sounds/Glass.aiff
say -v Milena 'Кончил' &
