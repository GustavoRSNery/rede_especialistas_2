import { ApiClient } from '../../view/react/services/apiService';
import { TaskDTO } from '../../view/react/dto/TaskDTO';

describe('Frontend API Client Security Tests', () => {
    it('deve injetar Nonce e Idempotency-Key automaticamente nas requisições POST', () => {
        const client = new ApiClient();
        const payload = client.preparePostPayload({ titulo: "Front Task" });
        
        expect(payload.headers).toHaveProperty('X-Nonce');
        expect(payload.headers).toHaveProperty('Idempotency-Key');
        expect(payload.headers['X-Nonce'].length).toBeGreaterThan(10); // UUID check
    });

    it('DTOs não devem permitir campos não mapeados (vazamento de dados)', () => {
        const dto = new TaskDTO({ titulo: "A", vazamento: "senha_admin" });
        expect(dto.vazamento).toBeUndefined();
    });
});

