import yaml
import os
from pathlib import Path

# Pega a raiz do projeto
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
COMPOSE_FILE = ROOT_DIR / "docker-compose.yml"

def test_docker_compose_file_exists():
    """Garante que o arquivo de orquestração existe na raiz."""
    # O teste deve falhar até criarmos o docker-compose.yml
    assert COMPOSE_FILE.exists(), "O docker-compose.yml obrigatório sumiu ou não foi criado."

def test_docker_compose_security_restrictions():
    """Valida se as restrições de topologia de redes C4 estão aplicadas."""
    if not COMPOSE_FILE.exists():
        return
        
    with open(COMPOSE_FILE, 'r') as f:
        compose = yaml.safe_load(f)
        
    services = compose.get('services', {})
    
    # 1. Verifica os containers base exigidos
    assert 'nginx' in services
    assert 'backend' in services
    assert 'frontend' in services
    assert 'postgres' in services
    assert 'redis' in services

    # 2. Segurança: Banco de dados relacional NÃO DEVE publicar portas na máquina host
    postgres_service = services['postgres']
    assert 'ports' not in postgres_service or len(postgres_service['ports']) == 0, \
        "FALHA DE SEGURANÇA: PostgreSQL está publicando porta (" + str(postgres_service.get('ports')) + ") para fora da network interna."

    # 3. Mapeamento de Redes corretos
    networks = compose.get('networks', {})
    assert 'public_net' in networks
    assert 'private_net' in networks
