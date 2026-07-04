<?php

use CodeIgniter\Router\RouteCollection;

/**
 * @var RouteCollection $routes
 */
$routes->get('/', 'Home::index');

$routes->group('api/v1', ['filter' => 'cors'], function ($routes) {

    // ========== AUTH (Public) ==========
    $routes->post('auth/login', 'Auth::login');
    $routes->get('auth/me', 'Auth::me', ['filter' => 'auth']);
    $routes->get('dashboard/admin', 'Dashboard::admin', ['filter' => 'auth']);
    $routes->put('auth/change-password', 'Auth::changePassword', ['filter' => 'auth']);
    // ADMIN - USERS
    $routes->group('users', ['filter' => 'auth'], function ($routes) {
        $routes->get('/', 'User::index');
        $routes->post('dosen', 'User::createDosen');
        $routes->post('mahasiswa', 'User::createMahasiswa');
        $routes->put('(:num)', 'User::update/$1');      // ✅ SATU SLASH
        $routes->delete('(:num)', 'User::delete/$1');   // ✅ SATU SLASH
    });

    // DOSEN - KELAS
    $routes->group('dosen', ['filter' => 'auth'], function ($routes) { 
    $routes->get('kelas', 'Kelas::index');
    $routes->get('dashboard', 'Dashboard::dosen');
        $routes->post('kelas', 'Kelas::create');
        $routes->get('kelas/(:num)', 'Kelas::show/$1');
        $routes->put('kelas/(:num)', 'Kelas::update/$1');
        $routes->delete('kelas/(:num)', 'Kelas::delete/$1');

        $routes->get('kelas/(:num)/tugas', 'Tugas::index/$1');
        $routes->post('kelas/(:num)/tugas', 'Tugas::create/$1');
        $routes->put('tugas/(:num)', 'Tugas::update/$1');
        $routes->delete('tugas/(:num)', 'Tugas::delete/$1');
        $routes->get('tugas/(:num)/pengumpulan', 'Pengumpulan::index/$1');
        $routes->put('pengumpulan/(:num)', 'Pengumpulan::update/$1');
        $routes->get('pengumpulan/(:num)/download', 'Pengumpulan::download/$1');
    });

        // ========== MAHASISWA ==========
    $routes->group('mahasiswa', ['filter' => 'auth'], function ($routes) {
        $routes->get('tugas', 'Mahasiswa::tugas');
        $routes->post('tugas/(:num)/submit', 'Mahasiswa::submit/$1');
        $routes->get('nilai', 'Mahasiswa::nilai');
        $routes->get('kelas', 'Mahasiswa::kelas');
        $routes->get('dashboard', 'Mahasiswa::dashboard');
        $routes->get('download/(:any)', 'Mahasiswa::download/$1');
        $routes->get('preview/(:any)', 'Mahasiswa::preview/$1');
        
    });
});