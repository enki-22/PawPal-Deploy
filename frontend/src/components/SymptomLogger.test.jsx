/**
 * Test suite for SymptomLogger component
 * 
 * Run with: npm test SymptomLogger.test.jsx
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import SymptomLogger from './SymptomLogger';

// Mock axios
jest.mock('axios');

// Mock pet data
const mockPet = {
  id: 1,
  name: 'Max',
  animal_type: 'dog',
  age: 5
};

// Mock API response
const mockApiResponse = {
  data: {
    success: true,
    message: 'Symptom log created successfully',
    symptom_log: {
      id: 123,
      pet: 1,
      symptoms: ['vomiting', 'lethargy'],
      risk_score: 35,
      risk_level: 'moderate',
      overall_severity: 'moderate'
    },
    risk_assessment: {
      score: 35,
      level: 'moderate',
      recommendation: '📋 MODERATE CONCERN: Schedule appointment within 24-48 hours.',
      risk_factors: [
        'Vomiting: 10 points',
        'Lethargy: 8 points',
        'Moderate symptoms (1.2x multiplier)'
      ],
      symptoms_evaluated: 2,
      total_symptoms_reported: 2
    },
    alert: null
  }
};

describe('SymptomLogger Component', () => {
  
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    localStorage.setItem('token', 'test-token');
  });

  describe('Rendering', () => {
    
    test('renders component with pet information', () => {
      render(<SymptomLogger pet={mockPet} />);
      
      expect(screen.getByText('🩺 Daily Symptom Log')).toBeInTheDocument();
      expect(screen.getByText('Max')).toBeInTheDocument();
      expect(screen.getByText('dog')).toBeInTheDocument();
    });

    test('renders all symptom categories', () => {
      render(<SymptomLogger pet={mockPet} />);
      
      expect(screen.getByText('General Symptoms')).toBeInTheDocument();
      expect(screen.getByText('Respiratory')).toBeInTheDocument();
      expect(screen.getByText('Skin & Coat')).toBeInTheDocument();
      expect(screen.getByText('Eyes & Ears')).toBeInTheDocument();
      expect(screen.getByText('Digestive')).toBeInTheDocument();
      expect(screen.getByText('Urinary')).toBeInTheDocument();
      expect(screen.getByText('Oral & Dental')).toBeInTheDocument();
      expect(screen.getByText('Behavioral')).toBeInTheDocument();
      expect(screen.getByText('Mobility')).toBeInTheDocument();
    });

    test('renders species-specific symptoms for birds', () => {
      const birdPet = { ...mockPet, animal_type: 'bird' };
      render(<SymptomLogger pet={birdPet} />);
      
      expect(screen.getByText('Bird-Specific')).toBeInTheDocument();
    });

    test('does not render species-specific symptoms for dogs', () => {
      render(<SymptomLogger pet={mockPet} />);
      
      expect(screen.queryByText('Bird-Specific')).not.toBeInTheDocument();
      expect(screen.queryByText('Fish-Specific')).not.toBeInTheDocument();
    });

    test('renders severity options', () => {
      render(<SymptomLogger pet={mockPet} />);
      
      expect(screen.getByText('🟢 Mild')).toBeInTheDocument();
      expect(screen.getByText('🟡 Moderate')).toBeInTheDocument();
      expect(screen.getByText('🔴 Severe')).toBeInTheDocument();
    });

    test('submit button is disabled initially', () => {
      render(<SymptomLogger pet={mockPet} />);
      
      const submitButton = screen.getByText(/Log Symptoms & Calculate Risk/i);
      expect(submitButton).toBeDisabled();
    });
  });

  describe('User Interactions', () => {
    
    test('allows selecting symptoms', async () => {
      render(<SymptomLogger pet={mockPet} />);
      
      // Click on vomiting symptom
      const vomitingCheckbox = screen.getByText('Vomiting').closest('label');
      fireEvent.click(vomitingCheckbox);
      
      // Check if symptom appears in selected summary
      await waitFor(() => {
        expect(screen.getByText('Selected Symptoms (1)')).toBeInTheDocument();
        expect(screen.getByText('Vomiting', { selector: '.symptom-chip' })).toBeInTheDocument();
      });
    });

    test('allows deselecting symptoms', async () => {
      render(<SymptomLogger pet={mockPet} />);
      
      // Select symptom
      const vomitingCheckbox = screen.getByText('Vomiting').closest('label');
      fireEvent.click(vomitingCheckbox);
      
      // Deselect symptom
      fireEvent.click(vomitingCheckbox);
      
      await waitFor(() => {
        expect(screen.queryByText('Selected Symptoms')).not.toBeInTheDocument();
      });
    });

    test('allows removing symptoms from chip', async () => {
      render(<SymptomLogger pet={mockPet} />);
      
      // Select symptom
      const vomitingCheckbox = screen.getByText('Vomiting').closest('label');
      fireEvent.click(vomitingCheckbox);
      
      // Remove from chip
      const removeButton = screen.getByText('Vomiting', { selector: '.symptom-chip' })
        .closest('.symptom-chip')
        .querySelector('button');
      fireEvent.click(removeButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Selected Symptoms')).not.toBeInTheDocument();
      });
    });

    test('allows changing severity', () => {
      render(<SymptomLogger pet={mockPet} />);
      
      const severeRadio = screen.getByText('🔴 Severe').closest('label').querySelector('input');
      fireEvent.click(severeRadio);
      
      expect(severeRadio).toBeChecked();
    });

    test('allows adding notes', () => {
      render(<SymptomLogger pet={mockPet} />);
      
      const notesTextarea = screen.getByPlaceholderText(/Any other observations/i);
      fireEvent.change(notesTextarea, { target: { value: 'Not eating well' } });
      
      expect(notesTextarea.value).toBe('Not eating well');
    });

    test('allows selecting comparison to yesterday', () => {
      render(<SymptomLogger pet={mockPet} />);
      
      const comparisonSelect = screen.getByRole('combobox');
      fireEvent.change(comparisonSelect, { target: { value: 'worse' } });
      
      expect(comparisonSelect.value).toBe('worse');
    });

    test('search filters symptoms', async () => {
      render(<SymptomLogger pet={mockPet} />);
      
      const searchInput = screen.getByPlaceholderText(/Search symptoms/i);
      fireEvent.change(searchInput, { target: { value: 'vomit' } });
      
      await waitFor(() => {
        expect(screen.getByText('Vomiting')).toBeInTheDocument();
        // Other symptoms should be filtered out of that category
      });
    });

    test('clear all button removes all symptoms', async () => {
      render(<SymptomLogger pet={mockPet} />);
      
      // Select multiple symptoms
      fireEvent.click(screen.getByText('Vomiting').closest('label'));
      fireEvent.click(screen.getByText('Lethargy').closest('label'));
      
      // Click clear all
      const clearAllButton = screen.getByText('Clear All');
      fireEvent.click(clearAllButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Selected Symptoms')).not.toBeInTheDocument();
      });
    });
  });

  describe('Category Expansion', () => {
    
    test('categories are expanded by default', () => {
      render(<SymptomLogger pet={mockPet} />);
      
      // Check if symptoms are visible (categories expanded)
      expect(screen.getByText('Vomiting')).toBeVisible();
      expect(screen.getByText('Coughing')).toBeVisible();
    });

    test('clicking category header toggles expansion', () => {
      render(<SymptomLogger pet={mockPet} />);
      
      const generalHeader = screen.getByText('General Symptoms').closest('button');
      
      // Collapse
      fireEvent.click(generalHeader);
      expect(screen.queryByText('Vomiting')).not.toBeVisible();
      
      // Expand
      fireEvent.click(generalHeader);
      expect(screen.getByText('Vomiting')).toBeVisible();
    });
  });

  describe('Form Submission', () => {
    
    test('submit button enables when symptoms selected', async () => {
      render(<SymptomLogger pet={mockPet} />);
      
      const submitButton = screen.getByText(/Log Symptoms & Calculate Risk/i);
      expect(submitButton).toBeDisabled();
      
      // Select a symptom
      fireEvent.click(screen.getByText('Vomiting').closest('label'));
      
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    test('submits form with correct data', async () => {
      axios.post.mockResolvedValue(mockApiResponse);
      
      render(<SymptomLogger pet={mockPet} />);
      
      // Select symptoms
      fireEvent.click(screen.getByText('Vomiting').closest('label'));
      fireEvent.click(screen.getByText('Lethargy').closest('label'));
      
      // Set severity
      fireEvent.click(screen.getByText('🟡 Moderate').closest('label'));
      
      // Add notes
      const notesTextarea = screen.getByPlaceholderText(/Any other observations/i);
      fireEvent.change(notesTextarea, { target: { value: 'Started yesterday' } });
      
      // Submit
      const submitButton = screen.getByText(/Log Symptoms & Calculate Risk/i);
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          '/api/chatbot/symptom-tracker/log/',
          expect.objectContaining({
            pet_id: 1,
            symptoms: expect.arrayContaining(['vomiting', 'lethargy']),
            overall_severity: 'moderate',
            notes: 'Started yesterday'
          }),
          expect.objectContaining({
            headers: expect.objectContaining({
              'Authorization': 'Token test-token',
              'Content-Type': 'application/json'
            })
          })
        );
      });
    });

    test('displays loading state during submission', async () => {
      axios.post.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      render(<SymptomLogger pet={mockPet} />);
      
      // Select symptom and submit
      fireEvent.click(screen.getByText('Vomiting').closest('label'));
      fireEvent.click(screen.getByText(/Log Symptoms & Calculate Risk/i));
      
      // Check loading state
      expect(screen.getByText(/Calculating Risk/i)).toBeInTheDocument();
    });

    test('calls onComplete callback on success', async () => {
      axios.post.mockResolvedValue(mockApiResponse);
      const onComplete = jest.fn();
      
      render(<SymptomLogger pet={mockPet} onComplete={onComplete} />);
      
      // Select symptom and submit
      fireEvent.click(screen.getByText('Vomiting').closest('label'));
      fireEvent.click(screen.getByText(/Log Symptoms & Calculate Risk/i));
      
      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledWith(mockApiResponse.data);
      });
    });

    test('handles API errors gracefully', async () => {
      const errorResponse = {
        response: {
          data: {
            details: {
              symptoms: ['Invalid symptom: xyz']
            }
          }
        }
      };
      axios.post.mockRejectedValue(errorResponse);
      
      // Mock alert
      window.alert = jest.fn();
      
      render(<SymptomLogger pet={mockPet} />);
      
      // Select symptom and submit
      fireEvent.click(screen.getByText('Vomiting').closest('label'));
      fireEvent.click(screen.getByText(/Log Symptoms & Calculate Risk/i));
      
      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Invalid symptom'));
      });
    });
  });

  describe('Risk Assessment Display', () => {
    
    test('displays risk assessment after successful submission', async () => {
      axios.post.mockResolvedValue(mockApiResponse);
      
      render(<SymptomLogger pet={mockPet} />);
      
      // Submit form
      fireEvent.click(screen.getByText('Vomiting').closest('label'));
      fireEvent.click(screen.getByText(/Log Symptoms & Calculate Risk/i));
      
      await waitFor(() => {
        expect(screen.getByText('✅ Symptoms Logged Successfully')).toBeInTheDocument();
        expect(screen.getByText('MODERATE')).toBeInTheDocument();
        expect(screen.getByText('35')).toBeInTheDocument();
        expect(screen.getByText(/Schedule appointment within 24-48 hours/i)).toBeInTheDocument();
      });
    });

    test('displays alert banner when alert is present', async () => {
      const responseWithAlert = {
        ...mockApiResponse,
        data: {
          ...mockApiResponse.data,
          alert: {
            id: 1,
            alert_type_display: '⚠️ Rapid Deterioration',
            alert_message: 'Symptoms are rapidly worsening'
          }
        }
      };
      axios.post.mockResolvedValue(responseWithAlert);
      
      render(<SymptomLogger pet={mockPet} />);
      
      // Submit
      fireEvent.click(screen.getByText('Vomiting').closest('label'));
      fireEvent.click(screen.getByText(/Log Symptoms & Calculate Risk/i));
      
      await waitFor(() => {
        expect(screen.getByText('⚠️ Rapid Deterioration')).toBeInTheDocument();
        expect(screen.getByText('Symptoms are rapidly worsening')).toBeInTheDocument();
      });
    });

    test('displays risk factors list', async () => {
      axios.post.mockResolvedValue(mockApiResponse);
      
      render(<SymptomLogger pet={mockPet} />);
      
      // Submit
      fireEvent.click(screen.getByText('Vomiting').closest('label'));
      fireEvent.click(screen.getByText(/Log Symptoms & Calculate Risk/i));
      
      await waitFor(() => {
        expect(screen.getByText('Vomiting: 10 points')).toBeInTheDocument();
        expect(screen.getByText('Lethargy: 8 points')).toBeInTheDocument();
      });
    });

    test('reset button returns to form', async () => {
      axios.post.mockResolvedValue(mockApiResponse);
      
      render(<SymptomLogger pet={mockPet} />);
      
      // Submit
      fireEvent.click(screen.getByText('Vomiting').closest('label'));
      fireEvent.click(screen.getByText(/Log Symptoms & Calculate Risk/i));
      
      // Wait for results
      await waitFor(() => {
        expect(screen.getByText('✅ Symptoms Logged Successfully')).toBeInTheDocument();
      });
      
      // Click reset
      fireEvent.click(screen.getByText('Log Another Entry'));
      
      // Should show form again
      expect(screen.getByText('🩺 Daily Symptom Log')).toBeInTheDocument();
      expect(screen.queryByText('Selected Symptoms')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    
    test('has proper ARIA labels', () => {
      render(<SymptomLogger pet={mockPet} />);
      
      // Check for accessible form elements
      expect(screen.getByRole('combobox')).toBeInTheDocument(); // Comparison select
      expect(screen.getAllByRole('checkbox')).toHaveLength(expect.any(Number)); // Symptom checkboxes
      expect(screen.getAllByRole('radio')).toHaveLength(3); // Severity options
    });

    test('supports keyboard navigation', async () => {
      render(<SymptomLogger pet={mockPet} />);
      
      const user = userEvent.setup();
      
      // Tab through form elements
      await user.tab();
      expect(screen.getByPlaceholderText(/Search symptoms/i)).toHaveFocus();
      
      await user.tab();
      // Should focus on first checkbox or category button
    });
  });
});
