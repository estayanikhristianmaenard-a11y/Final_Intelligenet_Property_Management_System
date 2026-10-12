<?php

namespace App\Http\Controllers;

class PortalController extends Controller
{
    public function index()
    {
        $html = file_get_contents(base_path('../propertypro-portal/index.html'));
        $config = '<meta name="csrf-token" content="'.e(csrf_token()).'">'
            .'<script>window.PROPERTYPRO_CONFIG={MODE:"live",BASE_URL:"/api/v1"};</script>';
        $html = str_replace('</head>', $config.'</head>', $html);
        $html = str_replace('./src/', '/portal-assets/', $html);
        return response($html)->header('Cache-Control', 'no-store');
    }

    public function asset(string $path)
    {
        $root = realpath(base_path('../propertypro-portal/src'));
        $file = realpath($root.DIRECTORY_SEPARATOR.$path);
        abort_unless($file && str_starts_with($file, $root.DIRECTORY_SEPARATOR) && is_file($file), 404);
        $mime = match (pathinfo($file, PATHINFO_EXTENSION)) {
            'js' => 'text/javascript',
            'css' => 'text/css',
            default => null,
        };
        abort_unless($mime, 404);
        return response()->file($file, ['Content-Type'=>$mime, 'Cache-Control'=>'no-cache']);
    }
}
