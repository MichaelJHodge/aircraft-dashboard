import * as React from 'react';
import { Button } from '../src/components/common/Button';

describe('Button', () => {
  it('builds expected button props', () => {
    const element = Button({
      children: 'Save',
      variant: 'secondary',
      size: 'large',
      disabled: true,
    });

    expect(React.isValidElement(element)).toBe(true);
    expect(element.type).toBe('button');
    expect(element.props.children).toBe('Save');
    expect(element.props.disabled).toBe(true);
    expect(element.props.type).toBe('button');
  });
});
