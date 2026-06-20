# Laravel API Backend (Blue-Green Deployment)

## Tech-Stack
- **Framework:** Laravel 11 (PHP 8.1+)
- **Server:** Apache/Nginx + PHP-FPM
- **Database:** MySQL/PostgreSQL mit Migrations
- **Queue:** Redis oder database für Jobs
- **Deployment:** Docker + Docker Compose oder traditional Server
- **Monitoring:** Laravel Telescope, New Relic, oder DataDog

## Maturity-Level
**Level 3 (Produktiv)** – Für Produktive Laravel APIs mit Zero-Downtime Deployments

---

## Architektur-Beschreibung

Laravel Backend-Deployments nutzen typischerweise Blue-Green Strategie:
1. **Blue**: Läuft aktuelle Version, erhält 100% des Traffic
2. **Green**: Neue Version wird deployed, Tests durchgeführt
3. **Switch**: Load-Balancer leitet Traffic zu Green um
4. **Fallback**: Falls Fehler, schnell zurück zu Blue

Typischer Flow:
- Git-Deployment (neue Version checken)
- Composer-Dependencies aktualisieren
- Database-Migrations ausführen
- Cache clearen
- Warm-up durchführen
- Health-Check durchführen
- Traffic switch
- Alte Version aufräumen

---

## Code-Snippet: artisan Deployment Commands

```php
// app/Console/Commands/DeployCommand.php
namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

class DeployCommand extends Command {
    protected $signature = 'deploy {--check-only} {--rollback}';
    protected $description = 'Deploy new version with zero-downtime';

    public function handle() {
        $checkOnly = $this->option('check-only');
        $rollback = $this->option('rollback');

        if ($rollback) {
            return $this->rollbackVersion();
        }

        try {
            // 1. Backup current version
            $this->info('📦 Creating backup...');
            $this->backupCurrentVersion();

            // 2. Update code
            $this->info('📥 Pulling latest code...');
            shell_exec('git pull origin main');
            shell_exec('composer install --no-dev --optimize-autoloader');

            // 3. Run migrations (with rollback protection)
            $this->info('🗄️ Running migrations...');
            if (!$this->runMigrations()) {
                $this->error('Migrations failed!');
                return $this->rollbackVersion();
            }

            if ($checkOnly) {
                $this->info('✅ Check-only mode: No changes committed');
                return 0;
            }

            // 4. Clear caches
            $this->info('🧹 Clearing caches...');
            Artisan::call('config:cache');
            Artisan::call('route:cache');
            Artisan::call('view:cache');

            // 5. Queue migrations (if needed)
            $this->info('⏳ Processing queued jobs...');
            Artisan::call('queue:work', ['--tries' => 3, '--timeout' => 60]);

            // 6. Health check
            $this->info('🏥 Running health checks...');
            if (!$this->healthCheck()) {
                $this->error('Health check failed!');
                return $this->rollbackVersion();
            }

            $this->info('✅ Deployment successful!');
            return 0;
        } catch (\Exception $e) {
            $this->error('Deployment failed: ' . $e->getMessage());
            return $this->rollbackVersion();
        }
    }

    private function backupCurrentVersion(): bool {
        $timestamp = now()->format('YmdHis');
        $backupDir = base_path("backups/v$timestamp");

        shell_exec("mkdir -p $backupDir");
        shell_exec("cp -r " . base_path() . " $backupDir");

        // Keep only last 5 backups
        $backups = glob(base_path('backups/v*'), GLOB_ONLYDIR);
        while (count($backups) > 5) {
            shell_exec('rm -rf ' . array_shift($backups));
        }

        return true;
    }

    private function runMigrations(): bool {
        try {
            // Start transaction to rollback on failure
            DB::transaction(function () {
                Artisan::call('migrate', ['--force' => true]);
            });
            return true;
        } catch (\Exception $e) {
            $this->error('Migration error: ' . $e->getMessage());
            // Rollback is automatic in transaction
            return false;
        }
    }

    private function healthCheck(): bool {
        $health = [
            'database' => false,
            'cache' => false,
            'api' => false
        ];

        // Database
        try {
            DB::connection()->getPdo();
            $health['database'] = true;
        } catch (\Exception $e) {
            $this->warn('❌ Database health check failed');
        }

        // Cache
        try {
            cache()->put('health_check', 'ok', 60);
            $health['cache'] = cache()->get('health_check') === 'ok';
        } catch (\Exception $e) {
            $this->warn('❌ Cache health check failed');
        }

        // API
        try {
            $response = file_get_contents('http://localhost/api/health');
            $health['api'] = strpos($response, 'ok') !== false;
        } catch (\Exception $e) {
            $this->warn('❌ API health check failed');
        }

        return array_reduce($health, fn($carry, $item) => $carry && $item, true);
    }

    private function rollbackVersion(): int {
        $this->error('🔄 Rolling back...');
        shell_exec('git reset --hard HEAD~1');
        Artisan::call('migrate:rollback');
        return 1;
    }
}
```

---

## Code-Snippet: Health Check Controller

```php
// app/Http/Controllers/HealthController.php
namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;

class HealthController extends Controller {
    public function check() {
        $health = [
            'status' => 'ok',
            'version' => config('app.version') ?? '0.0.0',
            'timestamp' => now()->toIso8601String(),
            'uptime' => (int)(microtime(true) - $_SERVER['REQUEST_TIME_FLOAT']),
            'dependencies' => [
                'database' => false,
                'redis' => false,
                'disk' => false
            ]
        ];

        // Database check
        try {
            DB::connection()->getPdo();
            $health['dependencies']['database'] = true;
        } catch (\Exception $e) {
            $health['status'] = 'degraded';
            $health['error'] = 'Database unavailable';
        }

        // Redis/Cache check
        try {
            Redis::ping();
            $health['dependencies']['redis'] = true;
        } catch (\Exception $e) {
            $health['status'] = 'degraded';
        }

        // Disk space check
        $diskUsagePercent = (disk_total_space('/') - disk_free_space('/')) / disk_total_space('/') * 100;
        $health['dependencies']['disk'] = $diskUsagePercent < 90;
        if ($diskUsagePercent > 90) {
            $health['status'] = 'degraded';
        }

        $statusCode = $health['status'] === 'ok' ? 200 : 503;
        return response()->json($health, $statusCode);
    }

    public function version() {
        return response()->json([
            'version' => config('app.version') ?? '0.0.0',
            'timestamp' => now()->toIso8601String(),
            'commit' => trim(shell_exec('git rev-parse HEAD'))
        ]);
    }
}
```

---

## Code-Snippet: Migration with Rollback Safety

```php
// database/migrations/2024_03_15_create_user_preferences_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        // Add column if it doesn't exist (backward compatible)
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'theme')) {
                $table->string('theme')->default('light')->after('email');
            }
            if (!Schema::hasColumn('users', 'language')) {
                $table->string('language')->default('en')->after('theme');
            }
        });

        // Create new table only if doesn't exist
        if (!Schema::hasTable('user_preferences')) {
            Schema::create('user_preferences', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->json('settings')->nullable();
                $table->timestamps();
                $table->index('user_id');
            });
        }
    }

    public function down(): void {
        // Only drop if safe (not used by other code)
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['theme', 'language']);
        });

        Schema::dropIfExists('user_preferences');
    }
};
```

---

## Code-Snippet: Deployment Script (Bash)

```bash
#!/bin/bash

# Blue-Green deployment script for Laravel

set -e

APP_DIR="/var/www/app"
BLUE_DIR="$APP_DIR/blue"
GREEN_DIR="$APP_DIR/green"
CURRENT_LINK="$APP_DIR/current"
NGINX_UPSTREAM="$APP_DIR/upstream.conf"

VERSION=$(cat $APP_DIR/VERSION)

echo "🚀 Starting deployment of version $VERSION"

# 1. Determine which is active
if [ -L $CURRENT_LINK ] && [ $(readlink $CURRENT_LINK) == "$BLUE_DIR" ]; then
    ACTIVE="blue"
    INACTIVE="green"
else
    ACTIVE="green"
    INACTIVE="blue"
fi

DEPLOY_DIR="${!INACTIVE}_DIR}"

echo "Active: $ACTIVE, Deploying to: $INACTIVE"

# 2. Clear old inactive deployment
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR

# 3. Pull and setup new version
cd $DEPLOY_DIR
git clone --depth 1 --branch main https://github.com/my-org/app.git .
composer install --no-dev --optimize-autoloader

# 4. Setup environment
cp $APP_DIR/shared/.env $DEPLOY_DIR/.env
cp -r $APP_DIR/shared/storage $DEPLOY_DIR/

# 5. Run migrations
php artisan migrate --force

# 6. Clear caches
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 7. Health check
echo "🏥 Running health checks..."
if ! php artisan health-check; then
    echo "❌ Health check failed"
    exit 1
fi

# 8. Update nginx upstream
echo "🔄 Switching traffic..."
if [ "$ACTIVE" == "blue" ]; then
    echo "server ${INACTIVE}_app:9000;" > $NGINX_UPSTREAM
else
    echo "server ${INACTIVE}_app:9000;" > $NGINX_UPSTREAM
fi

# Reload nginx
sudo systemctl reload nginx

# 9. Update current symlink
ln -sfn $DEPLOY_DIR $CURRENT_LINK

# 10. Cleanup old deployment (after 5 minutes)
(sleep 300 && rm -rf $APP_DIR/$ACTIVE) &

echo "✅ Deployment complete! Version $VERSION is now live"
```

---

## Code-Snippet: Docker Compose (Blue-Green)

```yaml
# docker-compose.yml
version: '3.8'

services:
  nginx:
    image: nginx:latest
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./upstream.conf:/etc/nginx/upstream.conf
    depends_on:
      - app-blue
      - app-green
    networks:
      - app

  app-blue:
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      - APP_ENV=production
      - APP_VERSION=3.2.0
    volumes:
      - app-shared-blue:/app/storage
    networks:
      - app
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/api/health"]
      interval: 10s
      timeout: 5s
      retries: 3

  app-green:
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      - APP_ENV=production
      - APP_VERSION=3.2.1
    volumes:
      - app-shared-green:/app/storage
    networks:
      - app
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/api/health"]
      interval: 10s
      timeout: 5s
      retries: 3

  mysql:
    image: mysql:8
    environment:
      - MYSQL_ROOT_PASSWORD=secret
      - MYSQL_DATABASE=app
    volumes:
      - mysql-data:/var/lib/mysql
    networks:
      - app

  redis:
    image: redis:latest
    networks:
      - app

volumes:
  app-shared-blue:
  app-shared-green:
  mysql-data:

networks:
  app:
    driver: bridge
```

---

## Gängige Fehler & Prävention

| Fehler | Ursache | Lösung |
|--------|--------|--------|
| **Migration schlägt fehl, Blue läuft noch** | Inkompatible Schema; alte App erwartet alte Spalten | Additive-only Migrations: neue Spalten hinzufügen, nicht löschen |
| **Requests to both versions gleichzeitig** | Traffic-Switch nicht atomaren durchgeführt | Upstream-Config in einem Schritt updaten; Test vorher |
| **Cache-Invalidierung unvollständig** | Cache-Key zu spezifisch | Config- + Route-Cache zusammen löschen |
| **Worker-Jobs schlagen fehl** | Queue-Job Schema inkompatibel | Job-Handler vor Code-Change updaten |

---

## Best Practices

1. **Backward-Compatibility:** Migrations sollten additive sein, nicht destruktiv
2. **Cached Config:** `config:cache` vor jedem Deploy ausführen
3. **Database Transactions:** Migrations in Transaktionen laufen, bei Fehler rollback
4. **Health Checks:** Immer ausführen vor Traffic-Switch
5. **Graceful Queue:** Workers cleanly shutdown; unverarbeitete Jobs zurück in Queue

---

## Links & Tools

- [Laravel Migrations](https://laravel.com/docs/migrations)
- [Laravel Deployment](https://laravel.com/docs/deployment)
- [Laravel Artisan Commands](https://laravel.com/docs/artisan)
- [Laravel Telescope (Debugging)](https://laravel.com/docs/telescope)
- [Blue-Green Deployment Pattern](https://martinfowler.com/bliki/BlueGreenDeployment.html)
