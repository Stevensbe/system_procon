from django.views import generic
from django.urls import reverse_lazy    # ← importe o reverse_lazy

from .models import (
    Departamento, Empresa, Multa, Cobranca,
    Peticao, Recurso, Analise, ConfigBancaria, ConfigSistema
)

# ——— CRUD de Empresa ———

class EmpresaList(generic.ListView):
    model = Empresa
    template_name = 'multas/empresa_list.html'
    context_object_name = 'empresas'

class EmpresaCreate(generic.CreateView):
    model = Empresa
    fields = '__all__'
    template_name = 'multas/empresa_form.html'
    success_url = reverse_lazy('multas:listar_empresa')

class EmpresaUpdate(generic.UpdateView):
    model = Empresa
    fields = '__all__'
    template_name = 'multas/empresa_form.html'
    success_url = reverse_lazy('multas:listar_empresa')

class EmpresaDelete(generic.DeleteView):
    model = Empresa
    template_name = 'multas/empresa_confirm_delete.html'
    success_url = reverse_lazy('multas:listar_empresa')

# ——— CRUD de Departamento ———

class DepartamentoList(generic.ListView):
    model = Departamento
    template_name = 'multas/departamento_list.html'
    context_object_name = 'departamentos'

class DepartamentoCreate(generic.CreateView):
    model = Departamento
    fields = '__all__'
    template_name = 'multas/departamento_form.html'
    success_url = reverse_lazy('multas:listar_departamento')

class DepartamentoUpdate(generic.UpdateView):
    model = Departamento
    fields = '__all__'
    template_name = 'multas/departamento_form.html'
    success_url = reverse_lazy('multas:listar_departamento')

class DepartamentoDelete(generic.DeleteView):
    model = Departamento
    template_name = 'multas/departamento_confirm_delete.html'
    success_url = reverse_lazy('multas:listar_departamento')

# ——— CRUD de Multa ———

class MultaList(generic.ListView):
    model = Multa
    template_name = 'multas/multa_list.html'
    context_object_name = 'multas'

class MultaCreate(generic.CreateView):
    model = Multa
    fields = '__all__'
    template_name = 'multas/multa_form.html'
    success_url = reverse_lazy('multas:listar_multa')

class MultaUpdate(generic.UpdateView):
    model = Multa
    fields = '__all__'
    template_name = 'multas/multa_form.html'
    success_url = reverse_lazy('multas:listar_multa')

class MultaDelete(generic.DeleteView):
    model = Multa
    template_name = 'multas/multa_confirm_delete.html'
    success_url = reverse_lazy('multas:listar_multa')

# ——— CRUD de Cobranca ———

class CobrancaList(generic.ListView):
    model = Cobranca
    template_name = 'multas/cobranca_list.html'
    context_object_name = 'cobrancas'

class CobrancaCreate(generic.CreateView):
    model = Cobranca
    fields = '__all__'
    template_name = 'multas/cobranca_form.html'
    success_url = reverse_lazy('multas:listar_cobranca')

class CobrancaUpdate(generic.UpdateView):
    model = Cobranca
    fields = '__all__'
    template_name = 'multas/cobranca_form.html'
    success_url = reverse_lazy('multas:listar_cobranca')

class CobrancaDelete(generic.DeleteView):
    model = Cobranca
    template_name = 'multas/cobranca_confirm_delete.html'
    success_url = reverse_lazy('multas:listar_cobranca')

# ——— CRUD de Peticao ———

class PeticaoList(generic.ListView):
    model = Peticao
    template_name = 'multas/peticao_list.html'
    context_object_name = 'peticoes'

class PeticaoCreate(generic.CreateView):
    model = Peticao
    fields = '__all__'
    template_name = 'multas/peticao_form.html'
    success_url = reverse_lazy('multas:listar_peticao')

class PeticaoUpdate(generic.UpdateView):
    model = Peticao
    fields = '__all__'
    template_name = 'multas/peticao_form.html'
    success_url = reverse_lazy('multas:listar_peticao')

class PeticaoDelete(generic.DeleteView):
    model = Peticao
    template_name = 'multas/peticao_confirm_delete.html'
    success_url = reverse_lazy('multas:listar_peticao')

# ——— CRUD de Recurso ———

class RecursoList(generic.ListView):
    model = Recurso
    template_name = 'multas/recurso_list.html'
    context_object_name = 'recursos'

class RecursoCreate(generic.CreateView):
    model = Recurso
    fields = '__all__'
    template_name = 'multas/recurso_form.html'
    success_url = reverse_lazy('multas:listar_recurso')

class RecursoUpdate(generic.UpdateView):
    model = Recurso
    fields = '__all__'
    template_name = 'multas/recurso_form.html'
    success_url = reverse_lazy('multas:listar_recurso')

class RecursoDelete(generic.DeleteView):
    model = Recurso
    template_name = 'multas/recurso_confirm_delete.html'
    success_url = reverse_lazy('multas:listar_recurso')

# ——— CRUD de Analise ———

class AnaliseList(generic.ListView):
    model = Analise
    template_name = 'multas/analise_list.html'
    context_object_name = 'analises'

class AnaliseCreate(generic.CreateView):
    model = Analise
    fields = '__all__'
    template_name = 'multas/analise_form.html'
    success_url = reverse_lazy('multas:listar_analise')

class AnaliseUpdate(generic.UpdateView):
    model = Analise
    fields = '__all__'
    template_name = 'multas/analise_form.html'
    success_url = reverse_lazy('multas:listar_analise')

class AnaliseDelete(generic.DeleteView):
    model = Analise
    template_name = 'multas/analise_confirm_delete.html'
    success_url = reverse_lazy('multas:listar_analise')

# ——— CRUD de ConfigBancaria ———

class ConfiguracaoList(generic.ListView):
    model = ConfigBancaria
    template_name = 'multas/configuracao_list.html'
    context_object_name = 'configuracoes'

class ConfiguracaoCreate(generic.CreateView):
    model = ConfigBancaria
    fields = '__all__'
    template_name = 'multas/configuracao_form.html'
    success_url = reverse_lazy('multas:listar_configuracao')

class ConfiguracaoUpdate(generic.UpdateView):
    model = ConfigBancaria
    fields = '__all__'
    template_name = 'multas/configuracao_form.html'
    success_url = reverse_lazy('multas:listar_configuracao')

class ConfiguracaoDelete(generic.DeleteView):
    model = ConfigBancaria
    template_name = 'multas/configuracao_confirm_delete.html'
    success_url = reverse_lazy('multas:listar_configuracao')
