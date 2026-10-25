# 手动部署步骤（腾讯云控制台 WebShell / OrcaTerm）

如果本机无法 SSH 登录服务器，可在腾讯云控制台「登录」进入 WebShell，按顺序执行。

## 1. 上传站点文件

- 站点已打包：`/tmp/chestnut-site.zip`（约 185M）
- WebShell 右上角/工具栏有「上传文件」按钮，把该 zip 上传到服务器 `/root/`

## 2. 备份现有 WordPress（务必先做）

```bash
STAMP=$(date +%Y%m%d-%H%M%S)
mkdir -p /root/site-backup
WEBROOT=$(grep -rh "root " /etc/nginx/sites-enabled/ 2>/dev/null | head -1 | sed 's/.*root //; s/;//')
[ -z "$WEBROOT" ] && WEBROOT=/www/wwwroot/default
echo "站点根目录：$WEBROOT"
tar czf /root/site-backup/webroot-$STAMP.tar.gz -C "$WEBROOT" . 2>/dev/null
command -v mysqldump >/dev/null && mysqldump --all-databases > /root/site-backup/db-$STAMP.sql
ls -lh /root/site-backup/
```

## 3. 解压站点

```bash
mkdir -p /var/www/chestnut
apt install -y unzip 2>/dev/null || yum install -y unzip
unzip -o /root/chestnut-site.zip -d /var/www/chestnut
ls /var/www/chestnut
```

## 4. 写入 Nginx 配置

把 `work/deploy/nginx.conf` 里的内容复制进去（域名已填好 chestnut.hi.cn）：

```bash
cat > /etc/nginx/sites-available/chestnut <<'NGINX'
# 粘贴 nginx.conf 全文
NGINX
ln -sf /etc/nginx/sites-available/chestnut /etc/nginx/sites-enabled/chestnut
```

> 若服务器用宝塔面板，Nginx 配置目录通常是 `/www/server/panel/vhost/nginx/`，
> 直接在宝塔面板「网站 → 设置 → 配置文件」里粘贴更省事，root 目录填 `/var/www/chestnut`。

## 5. 禁用旧站点并重载

```bash
for f in /etc/nginx/sites-enabled/*; do
  [ "$(basename $f)" = "chestnut" ] && continue
  grep -q "server_name.*chestnut.hi.cn" "$f" && mv "$f" "$f.disabled"
done
nginx -t && systemctl reload nginx
```

## 6. 验证

```bash
curl -I http://chestnut.hi.cn/
```
浏览器打开 http://chestnut.hi.cn/ 确认页面正常。

## 7. HTTPS（可选）

腾讯云控制台 → SSL 证书 → 申请免费证书（TrustAsia 90 天），下载 Nginx 版本证书，
上传到服务器后在配置里加 443 server 块；或者：

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d chestnut.hi.cn -d www.chestnut.hi.cn
```

⚠️ 记得先在腾讯云控制台「安全组」放行 **443** 端口（当前 80 已通、443 未开）。
