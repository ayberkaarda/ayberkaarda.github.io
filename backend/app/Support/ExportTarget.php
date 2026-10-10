<?php

namespace App\Support;

/**
 * Validates the export file location before anything is written or committed.
 *
 * The parent directory and the file (if it exists) must not be links, and
 * their resolved locations must stay inside the repository root. Windows
 * junctions are not reported by is_link(), so every check also compares the
 * resolved path with the path built from the resolved root without
 * following any link below it.
 */
class ExportTarget
{
    public const RELATIVE_DIR = 'frontend/public/data';

    public const FILE = 'projects.json';

    /**
     * True when $path is exactly <repo_root>/frontend/public/data/projects.json
     * with no link anywhere below the root.
     */
    public static function isPublishedFile(string $root, string $path): bool
    {
        $realRoot = self::real($root);
        if ($realRoot === null || $path === '' || basename($path) !== self::FILE) {
            return false;
        }

        return self::linkFree(dirname($path), $path)
            && self::same(self::real(dirname($path)), $realRoot.'/'.self::RELATIVE_DIR)
            && self::fileResolvesInPlace($path);
    }

    /**
     * True when $path may be written by the export command: the deepest
     * existing directory (and the file, if present) resolves inside the
     * repository root and is not a link.
     */
    public static function isWritableInside(string $root, string $path): bool
    {
        $realRoot = self::real($root);
        $file = basename($path);
        if ($realRoot === null || $path === '' || $file === '' || $file === '.' || $file === '..') {
            return false;
        }

        $dir = dirname($path);
        $existing = $dir;
        while (! is_dir($existing)) {
            if (is_link($existing) || file_exists($existing)) {
                return false;
            }
            $parent = dirname($existing);
            if ($parent === $existing) {
                return false;
            }
            $existing = $parent;
        }

        if (! self::linkFree($existing, $path)) {
            return false;
        }

        $resolved = self::real($existing);
        if ($resolved === null || ! self::inside($resolved, $realRoot)) {
            return false;
        }

        // Every missing component will be created as a plain directory below
        // $existing, so a path that still contains ".." is refused.
        $rest = substr(self::normalize($dir), strlen(self::normalize($existing)));
        if (preg_match('#(^|/)\.\.?(/|$)#', $rest)) {
            return false;
        }

        return self::fileResolvesInPlace($path);
    }

    private static function linkFree(string $dir, string $path): bool
    {
        return ! is_link($dir) && ! is_link($path);
    }

    /** An existing file must resolve to itself inside its resolved directory. */
    private static function fileResolvesInPlace(string $path): bool
    {
        if (! file_exists($path)) {
            return ! is_link($path);
        }
        if (! is_file($path)) {
            return false;
        }
        $dir = self::real(dirname($path));

        return $dir !== null && self::same(self::real($path), $dir.'/'.basename($path));
    }

    private static function inside(string $path, string $root): bool
    {
        $prefix = rtrim($root, '/').'/';

        return self::same($path, $root) || (PHP_OS_FAMILY === 'Windows'
            ? strncasecmp($path, $prefix, strlen($prefix)) === 0
            : str_starts_with($path, $prefix));
    }

    private static function same(?string $a, ?string $b): bool
    {
        if ($a === null || $b === null) {
            return false;
        }

        return PHP_OS_FAMILY === 'Windows' ? strcasecmp($a, $b) === 0 : $a === $b;
    }

    private static function real(string $path): ?string
    {
        if ($path === '') {
            return null;
        }
        $real = realpath($path);

        if ($real === false) {
            return null;
        }
        $normalized = rtrim(self::normalize($real), '/');

        return $normalized === '' ? '/' : $normalized;
    }

    private static function normalize(string $path): string
    {
        return str_replace('\\', '/', $path);
    }
}
