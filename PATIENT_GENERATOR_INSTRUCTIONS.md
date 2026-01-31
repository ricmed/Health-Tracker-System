# Gerador de Pacientes Fictícios

Este módulo permite popular o banco de dados com pacientes fictícios brasileiros para fins de teste e desenvolvimento.

## Como usar

Execute o comando via terminal na raiz do projeto:

```bash
python manage.py create_fake_patients [quantidade]
```

## Exemplos

Criar 1 paciente:
```bash
python manage.py create_fake_patients
```

Criar 10 pacientes:
```bash
python manage.py create_fake_patients 10
```

## Dados Gerados

O script utiliza a biblioteca `faker` (pt_BR) para gerar:
- Nome e Sobrenome
- CPF válido (e único)
- Data de Nascimento (18-90 anos)
- Endereço completo (Rua, Número, Bairro, Cidade, Estado, CEP)
- Dados de contato (Email, Telefone)
- Outros dados (Profissão, Estado Civil, Contato de Emergência)

**Nota:** O campo "Health Problem" não é preenchido, conforme solicitado.
