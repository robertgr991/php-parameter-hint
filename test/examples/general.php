<?php

function add(int...$vars) {
    $total = 0;

    foreach ($vars as $var) {
        $total += $var;
    }

    return $total;
}

echo join(', ', [1, 2, 3]);
echo add(1, 2, 3);