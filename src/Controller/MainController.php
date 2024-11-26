<?php

namespace App\Controller;

use Symfony\Component\HttpFoundation\Response;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Routing\Attribute\Route; 

class MainController extends AbstractController
{
    
    #[Route('/prediccion' , name: 'app_prediccion')]
    public function indexPrediccion(): Response
    {
        $this->denyAccessUnlessGranted('ROLE_USER');
        //$this->denyAccessUnlessGranted('IS_AUTHENTICATED');
        $variable = "Hola";
       return $this->render('prediccion/prediccion.html.twig', [
        'variable' => $variable,
       ]);
    }

    #[Route('/' , name: 'app_index')]
    public function registro(): Response
    {
        return $this->redirectToRoute('app_login');
    }
}