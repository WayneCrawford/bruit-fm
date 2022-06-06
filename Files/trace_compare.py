#! /usr/bin/env python3
# -*- coding: utf-8 -*-
from dataclasses import dataclass

from tiskit import SpectralDensity
from obspy.core.stream import Stream, Trace
from matplotlib import pyplot as plt
import numpy as np


class TraceCompare():
    def __init__(self, trace_compare_list):
        """
        Class to compare traces through different plots

        Args:
            trace_compare_list (list): list of lists, each sublist contains:
                [trace, label, color, linestype]
        """
        if not isinstance(trace_compare_list, list):
            raise TypeError('trace_compare_list is not a list!')
        for tc in trace_compare_list:
            if not isinstance(tc, list):
                raise TypeError('trace_compare_list is not a list!')
            if not len(tc) == 4:
                raise ValueError(f'traceplotter has {len(tc)} elements, not 4')
        self.list = [TracePlotter(x[0], x[1], x[2], x[3])
                     for x in trace_compare_list]

    def plot(self, inventory, seed_id, title="TraceCompare", show=False,
             alpha=1):
        """
        Plot overlapped streams
        Args:
            inventory (:class:Inventory): Inventory with inst responses
            title (str): plot title, also used in making filename
            show (bool): show on screen instead of saving to file
        """
        fig, ax = plt.subplots()
        for item in self.list:
            if item.trace is not None:
                ax.plot(item.trace.times("matplotlib"), item.trace.data,
                        label='a', color=item.color, linestyle=item.linestyle,
                        alpha=alpha)
        ax.set_xlabel('Time')
        # ax.xaxis.set_major_locator(mdates.AutoDatedLocator())
        ax.set_ylabel('Amplitude (counts)')
        ax.set_title(title)
        plt.legend()
        print(show)
        if show is True:
            plt.show()
        else:
            outfile = f'{title}.png'
            plt.savefig(outfile)

    def plot_psds(self, inv, title, ylims=[-185, -80], outfile='',
                  window_s=2000., show=False):
        """
        Args:
            inv (:class:Inventory): Inventory with inst responses
            title (str): plot title and output filename base
            ourfile (str): file to save to.  If not specified, uses
                {title}_streamPSDs.png
            window_s (float): window length in seconds
        """
        if not outfile:
            outfile = f'{title}_TraceCompare_psds.png'
        fig, ax = plt.subplots()
        for item in self.list:
            if item.trace is not None:
                sd = SpectralDensity.from_stream(Stream([item.trace]),
                                                 window_s=window_s,
                                                 inv=inv)
                ax.plot(sd.freqs, 10*np.log10(sd.autospect(item.trace.get_id())),
                        label=item.label, color=item.color, linestyle=item.linestyle)
        if ylims is not None:
            ax.set_ylim(ylims[0], ylims[1])
        # stats = item.stream[0].stats
        ax.set_xscale('log')
        ax.set_xlabel('Frequency (Hz)')
        ax.set_ylabel('PSD (dB ref 1 (m/s^2)^2/Hz)')
        ax.set_title(title)
        plt.legend()
        plt.savefig(outfile)
        if show is True:
            plt.show()


@dataclass
class TracePlotter:
    """A trace and its plot arguments"""
    trace: Trace
    label: str
    color: str
    linestyle: str = '-'
