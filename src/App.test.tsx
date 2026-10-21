import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

async function renderLoggedInApp() {
  render(<App />)
  const username = await screen.findByLabelText('Usuário', {}, { timeout: 2500 })
  fireEvent.change(username, { target: { value: 'admin' } })
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'admin' } })
  fireEvent.click(screen.getByRole('button', { name: /Entrar/i }))
  await screen.findByRole('heading', { name: /O que você precisa calcular/i })
}

describe('DoseCerta interface', () => {
  it('shows splash, rejects invalid credentials, and accepts the demo login', async () => {
    render(<App />)
    expect(screen.getByRole('main', { name: 'Carregando DoseCerta' })).toBeInTheDocument()
    const username = await screen.findByLabelText('Usuário', {}, { timeout: 2500 })
    expect(screen.getByText(/não protege dados reais/i)).toBeInTheDocument()
    fireEvent.change(username, { target: { value: 'admin' } })
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'incorreta' } })
    fireEvent.click(screen.getByRole('button', { name: /Entrar/i }))
    expect(screen.getByRole('alert')).toHaveTextContent('Usuário ou senha incorretos.')
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'admin' } })
    fireEvent.click(screen.getByRole('button', { name: /Entrar/i }))
    expect(await screen.findByRole('heading', { name: /O que você precisa calcular/i })).toBeInTheDocument()
  })

  it('returns to the login screen when the user exits', async () => {
    await renderLoggedInApp()
    fireEvent.click(screen.getByRole('button', { name: 'Sair' }))
    expect(screen.getByRole('heading', { name: 'Boas-vindas' })).toBeInTheDocument()
  })

  it('shows the available math tools and keeps weight-based dosing locked', async () => {
    await renderLoggedInApp()
    expect(screen.getByRole('heading', { name: /O que você precisa calcular/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Converter unidades/i })).toBeInTheDocument()
    expect(screen.getByText('Dose por peso')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Dose por peso/i }))
    expect(screen.getByRole('heading', { name: 'Dose por peso está bloqueada' })).toBeInTheDocument()
    expect(screen.getByText(/nenhum cálculo clínico é realizado/i)).toBeInTheDocument()
  })

  it('displays a unit conversion and its calculation memory', async () => {
    await renderLoggedInApp()
    fireEvent.click(screen.getByRole('button', { name: /Converter unidades/i }))
    fireEvent.change(screen.getByLabelText(/Valor a converter/i), { target: { value: '1500' } })
    expect(screen.getByText('1,5')).toBeInTheDocument()
    expect(screen.getByText(/fator de conversão/)).toBeInTheDocument()
  })

  it('shows an explicit mathematical caveat for mg to mL', async () => {
    await renderLoggedInApp()
    fireEvent.click(screen.getByRole('button', { name: /Converter mg para mL/i }))
    fireEvent.change(screen.getByLabelText(/Quantidade/i), { target: { value: '250' } })
    fireEvent.change(screen.getByLabelText(/Concentração informada/i), { target: { value: '50' } })
    expect(screen.getByText('5', { exact: true })).toBeInTheDocument()
    expect(screen.getByText(/Não valida dose, indicação, apresentação/).closest('.clinical-caveat')).toBeInTheDocument()
  })

  it('explains adult and pediatric scope without presenting future features as available', async () => {
    await renderLoggedInApp()
    fireEvent.click(screen.getByRole('button', { name: 'Segurança' }))
    expect(screen.getByRole('heading', { name: 'Não é só uma questão de peso' })).toBeInTheDocument()
    expect(screen.getByText('Crianças e adultos')).toBeInTheDocument()
    expect(screen.getByText('Um escopo por regra')).toBeInTheDocument()
    expect(screen.getAllByText('Planejado')).toHaveLength(4)
    expect(screen.getByText(/não orientações de dose ou um protocolo universal/i)).toBeInTheDocument()
  })

  it('adds a personal schedule, logs a taken dose, and updates entered stock', async () => {
    await renderLoggedInApp()
    fireEvent.click(screen.getByRole('button', { name: /Organize sua rotina/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }))
    fireEvent.change(screen.getByLabelText('Nome do medicamento'), { target: { value: 'Registro pessoal' } })
    fireEvent.change(screen.getByLabelText('Quantidade por horário'), { target: { value: '1' } })
    fireEvent.change(screen.getByLabelText('Estoque atual'), { target: { value: '10' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar registro' }))

    expect(screen.getAllByText('Registro pessoal')).toHaveLength(2)
    expect(screen.getByText('10 comprimidos')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Registrar tomada de Registro pessoal/ }))

    expect(screen.getByText('9 comprimidos')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Desfazer registro de Registro pessoal/ })).toHaveTextContent('Tomado')
    expect(screen.getByRole('button', { name: /tomadas registradas/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Atualizar estoque' }))
    fireEvent.change(screen.getByLabelText('Quantidade total atual'), { target: { value: '12' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar estoque' }))
    expect(screen.getByText('12 comprimidos')).toBeInTheDocument()
  })
})