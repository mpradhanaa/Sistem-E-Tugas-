<?php

namespace App\Filters;

use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\Filters\FilterInterface;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class Auth implements FilterInterface
{
    public function before(RequestInterface $request, $arguments = null)
    {
        // Ambil header Authorization
        $header = $request->getHeader('Authorization');
        if (!$header) {
            return service('response')->setJSON([
                'status' => 401,
                'message' => 'Token tidak ditemukan'
            ])->setStatusCode(401);
        }

        $token = $header->getValue();
        $token = str_replace('Bearer ', '', $token);

        try {
            $key = getenv('JWT_SECRET');
            $decoded = JWT::decode($token, new Key($key, 'HS256'));
            $request->user = $decoded;
        } catch (\Exception $e) {
            return service('response')->setJSON([
                'status' => 401,
                'message' => 'Token tidak valid'
            ])->setStatusCode(401);
        }
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
        
    }
}