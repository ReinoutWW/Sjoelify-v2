import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScoreEntry } from '../ScoreEntry';

describe('ScoreEntry', () => {
  const mockOnScoreSubmit = jest.fn();

  beforeEach(() => {
    mockOnScoreSubmit.mockClear();
  });

  it('renders all score input fields', () => {
    render(<ScoreEntry onScoreSubmit={mockOnScoreSubmit} />);

    expect(screen.getByLabelText(/2 Points Slot/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/3 Points Slot/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/4 Points Slot/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/1 Point Slot/i)).toBeInTheDocument();
  });

  it('updates total score when entering values', () => {
    render(<ScoreEntry onScoreSubmit={mockOnScoreSubmit} />);

    const inputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[0], { target: { value: '2' } }); // 2 points slot
    fireEvent.change(inputs[1], { target: { value: '3' } }); // 3 points slot
    fireEvent.change(inputs[2], { target: { value: '1' } }); // 4 points slot
    fireEvent.change(inputs[3], { target: { value: '4' } }); // 1 point slot

    // Total = (2 * 2) + (3 * 3) + (1 * 4) + (4 * 1) = 4 + 9 + 4 + 4 = 21
    expect(screen.getByText('21')).toBeInTheDocument();
  });

  it('submits scores when all fields are filled', () => {
    render(<ScoreEntry onScoreSubmit={mockOnScoreSubmit} />);

    const inputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[0], { target: { value: '2' } });
    fireEvent.change(inputs[1], { target: { value: '3' } });
    fireEvent.change(inputs[2], { target: { value: '1' } });
    fireEvent.change(inputs[3], { target: { value: '4' } });

    const submitButton = screen.getByRole('button', { name: /submit scores/i });
    fireEvent.click(submitButton);

    expect(mockOnScoreSubmit).toHaveBeenCalledWith([2, 3, 1, 4]);
  });

  it('shows active state when input is focused', () => {
    render(<ScoreEntry onScoreSubmit={mockOnScoreSubmit} />);

    const inputs = screen.getAllByRole('spinbutton');
    const firstInput = inputs[0];

    fireEvent.focus(firstInput);

    const container = firstInput.closest('div');
    expect(container).toHaveClass('border-primary-500');
    expect(container).toHaveClass('bg-primary-50');
  });

  it('disables submit button when not all fields are filled', () => {
    render(<ScoreEntry onScoreSubmit={mockOnScoreSubmit} />);

    const submitButton = screen.getByRole('button', { name: /submit scores/i });
    expect(submitButton).toBeDisabled();

    const inputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[0], { target: { value: '2' } });
    expect(submitButton).toBeDisabled();

    fireEvent.change(inputs[1], { target: { value: '3' } });
    fireEvent.change(inputs[2], { target: { value: '1' } });
    fireEvent.change(inputs[3], { target: { value: '4' } });
    expect(submitButton).not.toBeDisabled();
  });
}); 