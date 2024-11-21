<?php

namespace App\Entity;

use App\Repository\UsuarioRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: UsuarioRepository::class)]
class Usuario
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private ?string $nombreUsuario = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $observacionesUsuario = null;

    #[ORM\Column(type: Types::DATE_MUTABLE)]
    private ?\DateTimeInterface $ultimoIngreso = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $campoAdicional = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getNombreUsuario(): ?string
    {
        return $this->nombreUsuario;
    }

    public function setNombreUsuario(string $nombreUsuario): static
    {
        $this->nombreUsuario = $nombreUsuario;

        return $this;
    }

    public function getObservacionesUsuario(): ?string
    {
        return $this->observacionesUsuario;
    }

    public function setObservacionesUsuario(?string $observacionesUsuario): static
    {
        $this->observacionesUsuario = $observacionesUsuario;

        return $this;
    }

    public function getUltimoIngreso(): ?\DateTimeInterface
    {
        return $this->ultimoIngreso;
    }

    public function setUltimoIngreso(\DateTimeInterface $ultimoIngreso): static
    {
        $this->ultimoIngreso = $ultimoIngreso;

        return $this;
    }

    public function getCampoAdicional(): ?string
    {
        return $this->campoAdicional;
    }

    public function setCampoAdicional(?string $campoAdicional): static
    {
        $this->campoAdicional = $campoAdicional;

        return $this;
    }
}
