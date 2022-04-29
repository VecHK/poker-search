import React from 'react';
import { createLayout } from '.';
import { getTitleBarHeight } from '../../config';
import './Options.css';

interface Props {
  title: string;
}

const Options: React.FC<Props> = ({ title }: Props) => {
  return (
    <div className="OptionsContainer">
      <button onClick={() => {
        createLayout()
      }}>Open</button>
    </div>
  )
};

export default Options;
