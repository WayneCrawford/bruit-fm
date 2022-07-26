#! /usr/bin/env python3
# -*- coding: utf-8 -*-
from dataclasses import dataclass

import numpy as np
from obspy.core.stream import read, Stream
from obspy.core.inventory import read_inventory
import matplotlib.pyplot as plt

from tiskit import CleanRotator, SpectralDensity, DataCleaner

@dataclass
class TraceCompare:
    stream: Stream
    label: str
    color: str
    linestyle: str

# SET PARAMETERS
infiles = ['XS.S11D.LH.2016.12.11.mseed']
# CleanRotator parameters
rotate_band = (0.003, 0.02)  # freq band in which to calculate rotate angle
sp_kwargs = {'window_s': 2*1024, 'windowtype': 'prol1pi'}
dc_kwargs = {'max_freq': 0.1, 'show_progress': False, **sp_kwargs}
dc_tforder = ('*1', '*2', '*H')


for infile in infiles:
    stream = read(infile, 'MSEED')
    inv_decim = read_inventory('stations_PILAB_S_decimated.xml', 'STATIONXML')
    sta = stream[0].stats.station
    seed_id = stream[0].get_id()[:-5]
    print(f'Working on {sta=}, {seed_id=}')

    print('Plotting AutoSpectral Density Functions')
    sd = SpectralDensity.from_stream(stream, inv=inv_decim, **sp_kwargs)
    sd.plot(overlay=True)

    print('Running simple rotator')
    rotator = CleanRotator(stream, filt_band=rotate_band,
                           verbose=False, uselogvar=False)
    stream_rot = rotator.apply(stream)
    print(rotator)

    print('Running DataCleaner on unrotated and rotated data')
    dc = DataCleaner(stream, dc_tforder, **dc_kwargs)
    dc_rot = DataCleaner(stream_rot, dc_tforder, **dc_kwargs)

    print('Correcting data streams using DataCleaners')
    stream_dced_td = dc.clean_stream(stream, in_time_domain=True)
    stream_rot_dced_td = dc_rot.clean_stream(stream_rot, in_time_domain=True)
    stream_dced_fd = dc.clean_stream(stream, in_time_domain=False)
    stream_rot_dced_fd = dc_rot.clean_stream(stream_rot, in_time_domain=False)

    print('Comparing the PSDs of the different streams')
    ws = sp_kwargs["window_s"]
    fig, ax = plt.subplots()
    PSDs = {}
    for tc in (TraceCompare(stream,                 'original', 'grey', '-'),
               TraceCompare(stream_rot,      'simple rotation', 'grey', '--'),
               TraceCompare(stream_dced_td,    'orig+stream-clean_td', 'blue', '-'),
               TraceCompare(stream_rot_dced_td, 'rot+stream-clean_td', 'blue', '--'),
               TraceCompare(stream_dced_fd,    'orig+stream-clean_fd', 'red',  '-'),
               TraceCompare(stream_rot_dced_fd, 'rot+stream-clean_fd', 'red',  '--')
    ):
        tr = tc.stream.select(channel='*Z')
        sd = SpectralDensity.from_stream(tr, inv=inv_decim, **sp_kwargs)
        PSDs[tc.label] = 10*np.log10(sd.autospect(tr[0].id))
        freqs = sd.freqs
        ax.semilogx(sd.freqs, PSDs[tc.label], label=tc.label,
                    color=tc.color, linestyle=tc.linestyle)
    ax.set_ylim(-185, -80)
    ax.set_xlabel('Frequency (Hz)')
    ax.set_ylabel('PSD (dB ref 1 (m/s^2)^2/Hz)')
    ax.set_title(seed_id+f'{ws:.0f}s')

    print('Calculating rotated data PSD, applying DataCleaner during')
    sd_best = SpectralDensity.from_stream(stream_rot, data_cleaner=dc_rot,
                                          inv=inv_decim, **sp_kwargs)
    ax.semilogx(sd_best.freqs,
                10*np.log10(sd_best.autospect('XS.S11D..LHZ-1-2-H')),
                label='rot+psd-clean_fd',color='orange')
    plt.legend()
    plt.savefig(f'{seed_id}_{ws:.0f}s_comparePSDs.png')
    plt.show()
