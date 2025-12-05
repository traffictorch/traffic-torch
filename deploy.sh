#!/bin/bash
git add .
git commit -m "update" || true"
git push
npx gh-pages -d . --dotfiles true
