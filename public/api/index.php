<?php
// === НАСТРОЙКИ ===
// Укажите ваш исходный домен на Vercel
$vercel_host = 'https://kirakira-theta.vercel.app';
// =================

// Получаем путь запроса (обрезаем /api/ в начале)
$request_uri = $_SERVER['REQUEST_URI'];
$path = preg_replace('#^/api/#', '', parse_url($request_uri, PHP_URL_PATH));

// Формируем целевой URL на Vercel
$target_url = $vercel_host . '/api/' . $path;

// Добавляем GET параметры, если есть
if ($_SERVER['QUERY_STRING']) {
    $target_url .= '?' . $_SERVER['QUERY_STRING'];
}

$ch = curl_init($target_url);

// 1. Пробрасываем метод (GET, POST, OPTIONS...)
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $_SERVER['REQUEST_METHOD']);

// 2. Пробрасываем тело запроса (JSON)
$body = file_get_contents('php://input');
if ($body) {
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
}

// 3. Собираем и пробрасываем заголовки
$headers = [];
$headers[] = 'Content-Type: application/json';

// ВАЖНО: Передаем токен авторизации (JWT)
// Beget иногда прячет заголовок Authorization, поэтому проверяем два варианта
if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
    $headers[] = 'Authorization: ' . $_SERVER['HTTP_AUTHORIZATION'];
} else if (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
    $headers[] = 'Authorization: ' . $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
}

curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

// Выполняем запрос
$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if (curl_errno($ch)) {
    // Если ошибка curl
    http_response_code(500);
    echo json_encode(['error' => 'Proxy Error: ' . curl_error($ch)]);
} else {
    // Возвращаем ответ от Vercel как есть
    http_response_code($http_code);
    header('Content-Type: application/json');
    echo $response;
}
curl_close($ch);
?>