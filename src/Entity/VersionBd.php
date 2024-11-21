<?php

namespace App\Entity;

use App\Repository\VersionBdRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: VersionBdRepository::class)]
class VersionBd
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private ?string $numeroVersionBd = null;

    #[ORM\Column(type: Types::DATE_MUTABLE)]
    private ?\DateTimeInterface $fechaVersion = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getNumeroVersionBd(): ?string
    {
        return $this->numeroVersionBd;
    }

    public function setNumeroVersionBd(string $numeroVersionBd): static
    {
        $this->numeroVersionBd = $numeroVersionBd;

        return $this;
    }

    public function getFechaVersion(): ?\DateTimeInterface
    {
        return $this->fechaVersion;
    }

    public function setFechaVersion(\DateTimeInterface $fechaVersion): static
    {
        $this->fechaVersion = $fechaVersion;

        return $this;
    }
}
