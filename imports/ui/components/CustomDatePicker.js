import React from 'react';
import DatePicker from 'react-datepicker';
import { MONTHS } from '/imports/constants/constants';

export default CustomDatePicker = props => {
  const { selectedDate,  setSelectedDate, showTime = false, showTimeOnly = false, disabled = false, customInput=''} = props;

  const currentYear = new Date().getFullYear();
  const range = (start, stop, step) =>
    Array.from(
      { length: (stop - start) / step + 1 },
      (_, i) => start + i * step
    );
  const years = range(currentYear, currentYear - 100, -1);
  let dateFormat = 'MM/dd/yyyy';
  if (showTime) {
    dateFormat = 'MM/dd/yyyy h:mm aa';
  }

  if (showTime && showTimeOnly) {
    dateFormat = 'h:mm aa';
  }

  return (
    <DatePicker
      disabled={disabled}
      showTimeSelect={showTime}
      showTimeSelectOnly={showTimeOnly}
      timeFormat="hh:mm a"
      timeIntervals={15}
      renderCustomHeader={({
        date,
        changeYear,
        changeMonth,
        decreaseMonth,
        increaseMonth,
        prevMonthButtonDisabled,
        nextMonthButtonDisabled,
      }) => (
        <div
          style={{
            margin: 10,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <button
            onClick={decreaseMonth}
            disabled={prevMonthButtonDisabled}
          >
            {"<"}
          </button>
          <select
            value={date.getFullYear()}
            onChange={({ target: { value } }) => changeYear(value)}
          >
            {years.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <select
            value={MONTHS[date.getMonth()]}
            onChange={({ target: { value } }) =>
              changeMonth(MONTHS.indexOf(value))
            }
          >
            {MONTHS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <button
            onClick={increaseMonth}
            disabled={nextMonthButtonDisabled}
          >
            {">"}
          </button>
        </div>
      )}
      selected={selectedDate}
      onChange={(date) => setSelectedDate(date)}
      dateFormat={dateFormat}
      customInput={customInput}
    />
  );
}
