#!/usr/bin/env bash
# Runs on the server as root (deploy/deploy.mjs uploads the bundle and calls it):
#   install.sh <app> <base path> <port> <database> <origin>
# Installs or updates the app; the first run also makes its MySQL user and settings.
set -euo pipefail

APP=$1
BASE=$2
PORT=$3
DB=$4
ORIGIN=$5
SRC=/tmp/$APP-deploy
DEST=/opt/$APP
ETC=/etc/$APP
SITE=/etc/caddy/sites/kazin-dev.caddy
SITE_DIR=/etc/caddy/sites/kazin.dev.d

render() { sed -e "s|__APP__|$APP|g" -e "s|__BASE__|$BASE|g" -e "s|__PORT__|$PORT|g" "$1"; }

id $APP >/dev/null 2>&1 || useradd --system --home-dir $DEST --shell /usr/sbin/nologin $APP

# Code: server and common replaced, node_modules reinstalled from the lock file
mkdir -p $DEST
rm -rf $DEST/server.new $DEST/common $DEST/web
cp -r $SRC/server $DEST/server.new
[ -d $DEST/server/node_modules ] && cp -r $DEST/server/node_modules $DEST/server.new/
rm -rf $DEST/server && mv $DEST/server.new $DEST/server
cp -r $SRC/common $DEST/common
cp -r $SRC/web $DEST/web
(cd $DEST/server && npm ci --omit=dev --no-audit --no-fund --loglevel=error)
chown -R root:root $DEST
chmod -R a+rX $DEST

# Database (database.sql names tuticket_new; this app's database takes its place) and settings:
# made once, the passwords generated here and kept only in $ETC
sed "s/tuticket_new/$DB/g" $SRC/database.sql | mysql
if [ ! -f $ETC/settings.json ]; then
	mkdir -p $ETC
	DBPASS=$(openssl rand -hex 24)
	SECRET=$(openssl rand -hex 32)
	mysql -e "CREATE USER IF NOT EXISTS '$APP'@'127.0.0.1' IDENTIFIED BY '$DBPASS'; ALTER USER '$APP'@'127.0.0.1' IDENTIFIED BY '$DBPASS'; GRANT SELECT, INSERT, UPDATE, DELETE ON \`$DB\`.* TO '$APP'@'127.0.0.1'; FLUSH PRIVILEGES;"
	cat > $ETC/settings.json <<EOF
{
    "sessionSecret": "$SECRET",
    "host": "127.0.0.1",
    "port": $PORT,
    "clientDomains": ["$ORIGIN"],
    "database": {
        "host": "127.0.0.1",
        "user": "$APP",
        "password": "$DBPASS",
        "database": "$DB",
        "port": 3306,
        "connectionLimit": 10
    }
}
EOF
	echo "settings: made $ETC/settings.json"
fi
chown root:$APP $ETC $ETC/settings.json
chmod 750 $ETC
chmod 640 $ETC/settings.json

# Service
render $SRC/deploy/app.service > /etc/systemd/system/$APP.service
chmod 644 /etc/systemd/system/$APP.service
systemctl daemon-reload
systemctl enable --quiet $APP
systemctl restart $APP

# Caddy: the path block under kazin.dev, imported once from the portfolio's site file
mkdir -p $SITE_DIR
CADDY_CHANGED=0
render $SRC/deploy/app.caddy > $SRC/app.caddy.rendered
if ! cmp -s $SRC/app.caddy.rendered $SITE_DIR/$APP.caddy; then
	install -m 644 $SRC/app.caddy.rendered $SITE_DIR/$APP.caddy
	CADDY_CHANGED=1
fi
if ! grep -q "import $SITE_DIR/\*.caddy" $SITE; then
	cp $SITE $SITE.bak-$(date +%Y%m%d%H%M%S)
	sed -i "0,/root \* \/var\/www\/kazin.dev/s||&\n\n\t# Apps under kazin.dev/<name>, each installed by its own project\n\timport $SITE_DIR/*.caddy|" $SITE
	CADDY_CHANGED=1
fi
if [ $CADDY_CHANGED = 1 ]; then
	caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile >/dev/null
	# The admin API is off, so a reload is a restart
	systemctl reload caddy 2>/dev/null || systemctl restart caddy
	echo "caddy: reloaded"
fi

sleep 1
systemctl is-active $APP
rm -rf $SRC
