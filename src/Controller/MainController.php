<?php

namespace App\Controller;

use Symfony\Component\HttpFoundation\Response;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Routing\Attribute\Route; 

class MainController extends AbstractController
{
    
    #[Route('/prediccion')]
    public function indexPrediccion(): Response
    {
        $variable = "Hola";
       return $this->render('prediccion/prediccion.html.twig', [
        'variable' => $variable,
       ]);
    }
}