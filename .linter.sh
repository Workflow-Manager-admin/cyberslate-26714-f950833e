#!/bin/bash
cd /home/kavia/workspace/code-generation/cyberslate-26714-f950833e/cyberslate
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

