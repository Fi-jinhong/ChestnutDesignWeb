#!/bin/bash
# 通过密码登录一次性把本机公钥写入服务器，之后部署无需再输密码
# 用法：bash work/deploy/setup-ssh-key.sh 你的root密码
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck disable=SC1090
source "$SCRIPT_DIR/deploy.conf"

PASSWORD="${1:-}"
if [ -z "$PASSWORD" ]; then
  echo "用法：bash work/deploy/setup-ssh-key.sh 你的root密码"
  exit 1
fi

KEY="$HOME/.ssh/chestnut_deploy"
if [ ! -f "$KEY" ]; then
  mkdir -p "$HOME/.ssh"
  ssh-keygen -t ed25519 -f "$KEY" -N "" -C "chestnut-deploy" >/dev/null
  echo "已生成密钥：$KEY"
fi

PUB=$(cat "$KEY.pub")

expect <<EOF
set timeout 60
spawn ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" \
  "mkdir -p ~/.ssh && chmod 700 ~/.ssh && grep -qxF '$PUB' ~/.ssh/authorized_keys || echo '$PUB' >> ~/.ssh/authorized_keys; chmod 600 ~/.ssh/authorized_keys; echo KEY_OK"
expect {
  "*assword*" { send "$PASSWORD\r"; exp_continue }
  "KEY_OK" { puts "\n公钥已写入服务器" }
  timeout { puts "\n连接超时，请检查密码或安全组 22 端口"; exit 1 }
}
EOF

# 写入配置，之后部署免密
sed -i '' "s|^SSH_KEY=.*|SSH_KEY=\"$KEY\"|" "$SCRIPT_DIR/deploy.conf"
echo "已完成：deploy.conf 的 SSH_KEY 已自动填入，后续部署无需密码"
