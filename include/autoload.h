#pragma once

/* 
 * Start the autoload sequence in a background thread.
 * Returns 0 on success, -1 on failure.
 */
int nm_autoload_start();

/* 
 * Abort the current autoload sequence.
 */
void nm_autoload_abort();
void nm_autoload_reset();

/*
 * Get the remaining seconds in the countdown.
 * Returns -1 if no countdown is active.
 */
int nm_autoload_get_remaining_seconds();
void nm_autoload_get_status(int *total, int *done, char *current);
